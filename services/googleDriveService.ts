import { GDriveUser } from '../types';

declare const google: any;
declare const gapi: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const API_KEY = process.env.API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;
let pickerInited = false;

export const initClient = (callback: (user: GDriveUser | null) => void) => {
    // Load GAPI client
    gapi.load('client:picker', () => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        }).then(() => {
            gapiInited = true;
            if (gisInited) {
                // Check for existing session
                const token = gapi.client.getToken();
                if (token) {
                    fetchUserProfile(callback);
                } else {
                    callback(null);
                }
            }
        });
        pickerInited = true;
    });

    // Load GIS client
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
                fetchUserProfile(callback);
            } else {
                console.error('No access token received');
                callback(null);
            }
        },
    });
    gisInited = true;
};

const fetchUserProfile = async (callback: (user: GDriveUser | null) => void) => {
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` },
        });
        if (res.ok) {
            const profile = await res.json();
            const user: GDriveUser = {
                name: profile.name,
                email: profile.email,
                picture: profile.picture,
            };
            localStorage.setItem('gdriveUser', JSON.stringify(user));
            callback(user);
        } else {
            // Token might be expired, sign out
            signOut(callback);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        callback(null);
    }
};

export const signIn = (callback: (user: GDriveUser | null) => void) => {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        fetchUserProfile(callback);
    }
};

export const signOut = (callback: (user: null) => void) => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken(null);
            localStorage.removeItem('gdriveUser');
            callback(null);
        });
    }
};

export const uploadFile = async (fileName: string, data: any): Promise<boolean> => {
    try {
        const fileContent = JSON.stringify(data, null, 2);
        const file = new Blob([fileContent], { type: 'application/json' });

        const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: ['appDataFolder']
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${gapi.client.getToken().access_token}` },
            body: form,
        });

        return res.ok;
    } catch (error) {
        console.error('Error uploading file:', error);
        return false;
    }
};

export const showPicker = (): Promise<string | null> => {
    return new Promise((resolve) => {
        if (!pickerInited) {
            console.error("Picker API not ready");
            resolve(null);
            return;
        }

        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes('application/json');

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(CLIENT_ID?.split('-')[0] || '')
            .setOAuthToken(gapi.client.getToken().access_token)
            .addView(view)
            .setDeveloperKey(API_KEY)
            .setCallback((data: any) => {
                if (data.action === google.picker.Action.PICKED) {
                    const fileId = data.docs[0].id;
                    gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    }).then((res: any) => {
                        resolve(res.body);
                    }).catch((err: any) => {
                        console.error('Error fetching file content:', err);
                        resolve(null);
                    });
                } else if (data.action === google.picker.Action.CANCEL) {
                    resolve(null);
                }
            })
            .build();
        picker.setVisible(true);
    });
};