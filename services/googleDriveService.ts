// This service assumes that GOOGLE_API_KEY and GOOGLE_CLIENT_ID are available as environment variables.
// For example, in a Create React App, they would be REACT_APP_GOOGLE_API_KEY and REACT_APP_GOOGLE_CLIENT_ID.
const API_KEY = process.env.GOOGLE_API_KEY || '';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    gapi: any;
    google: any;
    tokenClient: any;
  }
}

let gapiInited = false;
let gisInited = false;

interface UserProfile {
    email: string;
    name: string;
    picture: string;
}

export const initGoogleClient = (callback: (isSignedIn: boolean, user?: UserProfile) => void) => {
  const scriptGapi = document.createElement('script');
  scriptGapi.src = 'https://apis.google.com/js/api.js';
  scriptGapi.async = true;
  scriptGapi.defer = true;
  scriptGapi.onload = () => {
    window.gapi.load('client:picker', initializeGapiClient(callback));
  };
  document.body.appendChild(scriptGapi);
  
  const scriptGis = document.createElement('script');
  scriptGis.src = 'https://accounts.google.com/gsi/client';
  scriptGis.async = true;
  scriptGis.defer = true;
  scriptGis.onload = () => {
    initializeGisClient(callback);
  };
  document.body.appendChild(scriptGis);
};

const initializeGapiClient = (callback: (isSignedIn: boolean, user?: UserProfile) => void) => async () => {
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  if(gisInited) checkSignInStatus(callback);
};

const initializeGisClient = (callback: (isSignedIn: boolean, user?: UserProfile) => void) => () => {
  window.tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
  if(gapiInited) checkSignInStatus(callback);
};

const checkSignInStatus = async (callback: (isSignedIn: boolean, user?: UserProfile) => void) => {
    // This is a simplified check. A robust implementation would handle token expiration.
    const token = window.gapi.client.getToken();
    const isSignedIn = token !== null;
    if(isSignedIn){
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${token.access_token}` }
            });
            if(response.ok){
                const user = await response.json();
                callback(true, { email: user.email, name: user.name, picture: user.picture });
            } else {
                callback(false);
            }
        } catch(e) {
            callback(false);
        }
    } else {
        callback(false);
    }
}

export const signIn = (callback: (isSignedIn: boolean, user?: UserProfile) => void) => {
  window.tokenClient.callback = async (resp: any) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    await checkSignInStatus(callback);
  };

  if (window.gapi.client.getToken() === null) {
    window.tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    window.tokenClient.requestAccessToken({ prompt: '' });
  }
};

export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      window.gapi.client.setToken('');
    });
  }
};

export const uploadBackup = async (jsonData: string, fileName: string): Promise<any> => {
    const file = new Blob([jsonData], { type: 'application/json' });
    const metadata = {
        'name': fileName,
        'mimeType': 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
        body: form,
    });
    
    return response.json();
};

export const selectBackup = (callback: (fileContent: string) => void) => {
    const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
    view.setMimeTypes("application/json");

    const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .setAppId(CLIENT_ID.split('-')[0])
        .setOAuthToken(window.gapi.client.getToken().access_token)
        .addView(view)
        .setDeveloperKey(API_KEY)
        .setCallback((data: any) => {
            if (data.action === window.google.picker.Action.PICKED) {
                const fileId = data.docs[0].id;
                window.gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }).then((res: any) => {
                    callback(res.body);
                });
            }
        })
        .build();
    picker.setVisible(true);
};