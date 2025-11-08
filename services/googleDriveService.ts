import { GDriveUser } from '../types';

// These are loaded from the script tags in index.html
declare var gapi: any;
declare var google: any;

// As per guidelines, API_KEY is assumed to be in the environment.
const API_KEY = process.env.API_KEY!;
// The Google Client ID is also required for OAuth and the Picker API.
// It is assumed to be available in the environment.
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

const DISCOVERY_DOCS = [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest"
];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;
let currentUser: GDriveUser | null = null;

const gapiLoadPromise = new Promise<void>((resolve) => {
    // gapi.load is a one-time operation.
    gapi.load('client:picker', resolve);
});

const gisLoadPromise = new Promise<void>((resolve, reject) => {
    // This can be a race condition, so we poll for the google object.
    const interval = setInterval(() => {
        // FIX: Use the globally declared `google` object instead of `window.google`
        // to resolve TypeScript errors and maintain consistency with the rest of the file.
        if (google && google.accounts) {
            clearInterval(interval);
            resolve();
        }
    }, 100);
    // Timeout after 5s
    setTimeout(() => {
        clearInterval(interval);
        reject(new Error("Google Identity Services failed to load."));
    }, 5000);
});

export async function initClient(): Promise<void> {
    await Promise.all([gapiLoadPromise, gisLoadPromise]);

    await new Promise<void>((resolve, reject) => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        }).then(() => {
            gapiInited = true;
            resolve();
        }).catch(reject);
    });

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // The callback is handled by the promise in signIn
    });
    gisInited = true;
}

async function getUserProfile(): Promise<GDriveUser | null> {
    try {
        const response = await gapi.client.oauth2.userinfo.get();
        if (response && response.result) {
            currentUser = {
                name: response.result.name,
                email: response.result.email,
                picture: response.result.picture,
            };
            return currentUser;
        }
        return null;
    } catch (error) {
        console.error("Failed to get user profile:", error);
        return null;
    }
}

export function getCurrentUser(): GDriveUser | null {
    return currentUser;
}

export function signIn(): Promise<GDriveUser> {
    return new Promise((resolve, reject) => {
        const callback = async (resp: any) => {
            if (resp.error !== undefined) {
                return reject(resp);
            }
            // Now that we have the token, get user profile
            const user = await getUserProfile();
            if (user) {
                resolve(user);
            } else {
                reject(new Error("Could not retrieve user profile."));
            }
        };
        tokenClient.callback = callback;

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
}

export function signOut(): void {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {});
        gapi.client.setToken(null);
        currentUser = null;
    }
}

export function uploadFile(fileName: string, fileContent: string): Promise<any> {
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    let multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        close_delim;
    
    return gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: {
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
}

export function showPicker(): Promise<string> {
    return new Promise((resolve, reject) => {
        const token = gapi.client.getToken();
        if (!token) {
            return reject(new Error("User not authenticated"));
        }

        const view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("application/json");

        const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .setAppId(CLIENT_ID.split('-')[0]) // The App ID is the first part of the Client ID
            .setOAuthToken(token.access_token)
            .addView(view)
            .setDeveloperKey(API_KEY)
            .setCallback((data: any) => {
                if (data[google.picker.Action.PICKED]) {
                    const fileId = data[google.picker.Response.DOCUMENTS][0][google.picker.Document.ID];
                    // Use Drive API to fetch the file content
                    gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    }).then((res: any) => {
                        resolve(res.body);
                    }).catch(reject);
                } else if (data.action === google.picker.Action.CANCEL) {
                    reject(new Error('Picker cancelled'));
                }
            })
            .build();
        picker.setVisible(true);
    });
}