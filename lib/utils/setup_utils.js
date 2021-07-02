'use babel';
import fs from 'fs';
import yaml from 'js-yaml';
import { isPortAvailable, initExpressServer } from "./login_utils";
import { repoIsNotSynced } from "./event_utils";
import { showSignUpButtons, showConnectRepo } from "./notifications";
import {
	CODESYNC_ROOT, SHADOW_REPO, DIFFS_REPO, ORIGINALS_REPO,
	DELETED_REPO, USER_PATH, Auth0URLs, CONFIG_PATH, SEQUENCE_TOKEN_PATH
} from "../constants";
import { readYML } from './common';
import { initUtils} from "./init_utils";


export const setupCodeSync = async (repoPath) => {
	// Create system directories
	const paths = [CODESYNC_ROOT, DIFFS_REPO, ORIGINALS_REPO, SHADOW_REPO, DELETED_REPO];
	paths.forEach((path) => {
		if (!fs.existsSync(path)) {
			// Add file in originals repo
			fs.mkdirSync(path, { recursive: true });
		}
	});

	// Create config.yml if does not exist
	const configExists = fs.existsSync(CONFIG_PATH);
	if (!configExists) {
		fs.writeFileSync(CONFIG_PATH, yaml.safeDump({ repos: {} }));
	}

	// Create sequence_token.yml if does not exist
	const sequenceTokenExists = fs.existsSync(SEQUENCE_TOKEN_PATH);
	if (!sequenceTokenExists) {
		fs.writeFileSync(SEQUENCE_TOKEN_PATH, yaml.safeDump({}));
	}

	let port = 0;
	for (const _port of Auth0URLs.PORTS) {
		const isAvailable = await isPortAvailable(_port);
		if (isAvailable) {
			port = _port;
			break;
		}
	}

	initExpressServer(port);

	if (!fs.existsSync(USER_PATH)) {
		showSignUpButtons(port);
	}

	// Check if access token is present against users
	const users = readYML(USER_PATH) || {};
	const validUsers = [];
	Object.keys(users).forEach(key => {
		const user = users[key];
		if (user.access_token) {
			validUsers.push(user.email);
		}
	});

	if (validUsers.length === 0) {
		showSignUpButtons(port);
		return;
	}

	// If repo is synced, do not go for Login
	if (repoPath && (repoIsNotSynced(repoPath) || !initUtils.successfulySynced(repoPath))) { 
		// Show notification to user to Sync the repo
		showConnectRepo(repoPath, "", "", port);
		return;
	}
};
