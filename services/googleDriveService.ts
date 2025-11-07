
declare const gapi: any;
declare const google: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'QuotInv AI Backups';
const FILE_NAME = 'quotinv_ai_backup.json';

let tokenClient: any = null;

export const initGoogleClient = (clientId: string, callback: (client: any) => void) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: callback,
    });
};

export const loadGapi = (callback: () => void) => {
    gapi.load('client', callback);
};

export const gapiInit = (callback: () => void) => {
     gapi.client.init({
        apiKey: '', // API key is not required for OAuth2 file operations
        discoveryDocs: [DISCOVERY_DOC],
     }).then(callback);
}

export const handleAuthClick = () => {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
};

export const handleSignOutClick = () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
        });
    }
};

const getFolderId = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
            fields: 'files(id, name)',
        });
        if (response.result.files.length > 0) {
            return response.result.files[0].id;
        }
        return null;
    } catch (e: any) {
        console.error("Error finding folder:", e.result.error.message);
        if (e.result.error.code === 401) throw new Error("invalid authentication");
        return null;
    }
};

const createFolder = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.create({
            resource: {
                name: FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });
        return response.result.id;
    } catch (e: any) {
        console.error("Error creating folder:", e.result.error.message);
        return null;
    }
};

const getFileId = async (folderId: string): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `'${folderId}' in parents and name='${FILE_NAME}' and trashed=false`,
            fields: 'files(id)',
        });
        if (response.result.files.length > 0) {
            return response.result.files[0].id;
        }
        return null;
    } catch (e: any) {
        console.error("Error finding file:", e.result.error.message);
        return null;
    }
};

export const saveBackupToDrive = async (data: object): Promise<any> => {
    let folderId = await getFolderId();
    if (!folderId) {
        folderId = await createFolder();
    }

    if (!folderId) {
        throw new Error('Could not create or find the backup folder in Google Drive.');
    }

    const fileId = await getFileId(folderId);
    const backupData = JSON.stringify(data, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    
    const metadata = {
        name: FILE_NAME,
        mimeType: 'application/json',
        ...(fileId ? {} : { parents: [folderId] }), // only add parents on creation
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const uploadUrl = fileId
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(uploadUrl, {
        method: fileId ? 'PATCH' : 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
        body: form,
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('File upload failed:', errorBody);
        throw new Error('Failed to save backup to Google Drive.');
    }

    return await response.json();
};

export const loadBackupFromDrive = async (): Promise<object | null> => {
    const folderId = await getFolderId();
    if (!folderId) {
        console.log("Backup folder not found.");
        return null;
    }

    const fileId = await getFileId(folderId);
    if (!fileId) {
        console.log("Backup file not found.");
        return null;
    }

    try {
        const response = await gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        return JSON.parse(response.body);
    } catch (e: any) {
        console.error("Error loading backup:", e);
        return null;
    }
}
