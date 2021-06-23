'use babel';

const untildify =  require('untildify');
const authConfig = require('./config.json');

export const CODESYNC_ROOT = untildify('~/.codesync');
export const DIFFS_REPO = `${CODESYNC_ROOT}/.diffs/.atom`;
export const ORIGINALS_REPO = `${CODESYNC_ROOT}/.originals`;
export const SHADOW_REPO = `${CODESYNC_ROOT}/.shadow`;
export const DELETED_REPO = `${CODESYNC_ROOT}/.deleted`;
export const CONFIG_PATH = `${CODESYNC_ROOT}/config.yml`;
export const USER_PATH = `${CODESYNC_ROOT}/user.yml`;
export const SEQUENCE_TOKEN_PATH = `${CODESYNC_ROOT}/sequence_token.yml`;

export const DIFF_SOURCE = 'atom';
export const DATETIME_FORMAT = 'UTC:yyyy-mm-dd HH:MM:ss.l';
export const DEFAULT_BRANCH = 'default';
export const GIT_REPO = '.git/';
export const RESTART_DAEMON_AFTER = 5000;

// export const CODESYNC_DOMAIN = '127.0.0.1:8000';
// export const CODESYNC_HOST = 'http://127.0.0.1:8000';
export const CODESYNC_DOMAIN = "codesync-server.herokuapp.com";
export const CODESYNC_HOST = 'https://codesync-server.herokuapp.com';
export const API_ENDPOINT = `${CODESYNC_HOST}/v1`;
export const API_FILES = `${API_ENDPOINT}/files`;
export const API_USERS = `${API_ENDPOINT}/users`;
export const API_HEALTHCHECK = `${CODESYNC_HOST}/healthcheck`;
export const WEBSOCKET_ENDPOINT = `ws://${CODESYNC_DOMAIN}/v1/websocket`;

// Diff related constants
export const DIFF_FILES_PER_ITERATION = 50;
export const REQUIRED_DIFF_KEYS = ['repo_path', 'branch', 'file_relative_path', 'created_at'];
export const REQUIRED_FILE_RENAME_DIFF_KEYS = ['old_abs_path', 'new_abs_path', 'old_rel_path', 'new_rel_path'];
export const REQUIRED_DIR_RENAME_DIFF_KEYS = ['old_path', 'new_path'];
export const DIFF_SIZE_LIMIT = 16 * 1000 * 1000;

// AWS constants
export const AWS_REGION = 'us-east-1';
export const CLIENT_LOGS_GROUP_NAME = 'client-logs';

// Error msgs
export const CONNECTION_ERROR_MESSAGE = 'Error => Server is not available. Please try again in a moment';
export const INVALID_TOKEN_MESSAGE = 'Error => Auth token provided is invalid';

// Auth0
export const Auth0URLs = {
	AUTHORIZE: "https://codesyncapp.us.auth0.com/authorize",
	GET_TOKEN: "https://codesyncapp.us.auth0.com/oauth/token",
	CLIENT_KEY: authConfig.clientKey,
	CLIENT_SECRET: authConfig.clientSecret,
	REDIRECT_URI: "http://localhost",
	// TODO: Define valid ports after defining in auth0 portal
	// Pre defined ports
	PORTS: [
		49165,
		49170, 
		49175, 
		49180, 
		50100,
		50105, 
		50110, 
		50115, 
		50120,
		49160
	]
};

// Notification Buttons
export const NOTIFICATION_CONSTANTS = {
	JOIN: "Join",
	WELCOME_MSG: "Welcome to CodeSync!",
	CONNECT_REPO: "Connect your repo with CodeSync",
	LOGIN_SUCCESS: "Successfully logged in to CodeSync",
	LOGIN_FAILED: "Sign up to CodeSync failed",
	CONNECT: "Connect",
	IGNORE: 'Ignore'
};
