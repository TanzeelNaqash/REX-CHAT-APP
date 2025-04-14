export const HOST = import.meta.env.VITE_SERVER_URL;


export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`
export const ADD_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/add-profile-image`
export const REMOVE_PROFILE_IMAGE_ROUTE = `${AUTH_ROUTES}/remove-profile-image`
export const ADD_BACKGROUND_IMAGE_ROUTE = `${AUTH_ROUTES}/add-background-image`
export const REMOVE_BACKGROUND_IMAGE_ROUTE = `${AUTH_ROUTES}/remove-background-image`
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`
export const FORGOT_PASSWORD_ROUTE = `${AUTH_ROUTES}/forgot-password`;
export const VERIFY_OTP_ROUTE = `${AUTH_ROUTES}/verify-otp`;
export const RESET_PASSWORD_ROUTE = `${AUTH_ROUTES}/reset-password`;


export const CONTACTSROUTES = "api/contacts"
export const SEARCH_CONTACT_ROUTE = `${CONTACTSROUTES}/search`
export const GET_DM_CONTACTS_ROUTE = `${CONTACTSROUTES}/get-contacts-for-dm`
export const GET_ALL_CONTACTS_ROUTE = `${CONTACTSROUTES}/get-all-contacts`
 

export const MESSAGES_ROUTES = "api/messages"
export const GET_ALL_MESSAGES_ROUTE = `${MESSAGES_ROUTES}/get-messages`
export const UPLOAD_FILE_ROUTE = `${MESSAGES_ROUTES}/upload-file`


export const GROUP_ROUTES = "api/group"
export const CREATE_GROUP_ROUTE = `${GROUP_ROUTES}/create-group`
export const GET_USER_GROUPS_ROUTE = `${GROUP_ROUTES}/get-user-groups`
export const GET_GROUP_MESSAGES = `${GROUP_ROUTES}/get-group-messages`