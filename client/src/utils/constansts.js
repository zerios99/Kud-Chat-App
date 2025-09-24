export const HOST = import.meta.env.VITE_SERVER_URL;

export const AUTH_ROUTES = "api/auth";
export const SINGUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/userInfo`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/updateProfile`;
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/addProfileImage`;
export const REMOVE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/removeProfileImage`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;

export const CONTACTS_ROUTES = "api/contacts";
export const SEARCH_CONTACTS_ROUTES = `${CONTACTS_ROUTES}/search`;
export const GET_CONTACTS_DM_ROUTES = `${CONTACTS_ROUTES}/get-contacts-for-dm`;
export const GET_ALL_CONTACTS_ROUTES = `${CONTACTS_ROUTES}/get-all-contacts`;

export const MESSAGES_ROUTES = "api/messages";
export const GET_ALL_MESSAGES_ROUTES = `${MESSAGES_ROUTES}/get-messages`;
export const UPLOAD_FILE_ROUTE = `${MESSAGES_ROUTES}/upload-file`;
export const UPLOAD_VOICE_ROUTE = `${MESSAGES_ROUTES}/upload-voice`;

export const GROUP_ROUTE = "api/channel";
export const CREATE_GROUP_ROUTE = `${GROUP_ROUTE}/create-channel`;
export const GET_USER_GROUP_ROUTE = `${GROUP_ROUTE}/get-user-channels`;
export const GET_GROUP_MESSAGES_ROUTES = `${GROUP_ROUTE}/get-channels-messages`;
