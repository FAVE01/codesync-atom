import fs from "fs";
import yaml from "js-yaml";
import untildify from "untildify";

import {buildAtomEnv, randomBaseRepoPath, randomRepoPath} from "../../helpers/helpers";
import {createSystemDirectories, setupCodeSync, showConnectRepoView, showLogIn} from "../../../lib/utils/setup_utils";
import {NOTIFICATION} from "../../../lib/constants";


describe("createSystemDirectories",  () => {
    const baseRepoPath = randomBaseRepoPath();

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, { recursive: true });
    });

    afterEach(() => {
        fs.rmdirSync(baseRepoPath, { recursive: true });
    });

    test('createSystemDirectories',  () => {
        createSystemDirectories();
        const lsResult = fs.readdirSync(baseRepoPath);
        expect(lsResult.includes(".diffs")).toBe(true);
        expect(lsResult.includes(".originals")).toBe(true);
        expect(lsResult.includes(".shadow")).toBe(true);
        expect(lsResult.includes(".deleted")).toBe(true);
        expect(lsResult.includes("config.yml")).toBe(true);
        expect(lsResult.includes("sequence_token.yml")).toBe(true);
    });
});

describe("setupCodeSync",  () => {
    const baseRepoPath = randomBaseRepoPath();
    const repoPath = randomRepoPath();
    const userFilePath = `${baseRepoPath}/user.yml`;
    const userData = {"dummy_email": {access_token: "ABC"}};

    const configPath = `${baseRepoPath}/config.yml`;
    const configData = {repos: {}};
    configData.repos[repoPath] = {branches: {}};

    beforeEach(() => {
        jest.clearAllMocks();
        buildAtomEnv();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, {recursive: true});
        fs.mkdirSync(repoPath, {recursive: true});
    });

    afterEach(() => {
        fs.rmdirSync(baseRepoPath, {recursive: true});
        fs.rmdirSync(repoPath, {recursive: true});
    });

    test('with no user.yml', async () => {
        const port = await setupCodeSync(repoPath);
        const lsResult = fs.readdirSync(baseRepoPath);
        expect(lsResult.includes(".diffs")).toBe(true);
        expect(lsResult.includes(".originals")).toBe(true);
        expect(lsResult.includes(".shadow")).toBe(true);
        expect(lsResult.includes(".deleted")).toBe(true);
        expect(lsResult.includes("config.yml")).toBe(true);
        expect(lsResult.includes("sequence_token.yml")).toBe(true);
        // should return port number
        expect(port).toBeTruthy();
        expect(global.atom.notifications.addInfo).toHaveBeenCalledTimes(1);
        expect(global.atom.notifications.addInfo.mock.calls[0][0]).toBe(NOTIFICATION.WELCOME_MSG);
        const options = global.atom.notifications.addInfo.mock.calls[0][1];
        expect(options.buttons).toHaveLength(1);
        expect(options.buttons[0].text).toStrictEqual(NOTIFICATION.JOIN);
        expect(options.dismissable).toBe(true);

    });

    test('with empty user.yml', async () => {
        fs.writeFileSync(userFilePath, yaml.safeDump({}));
        const port = await setupCodeSync(repoPath);
        // should return port number
        expect(port).toBeTruthy();
        expect(global.atom.notifications.addInfo).toHaveBeenCalledTimes(1);
        expect(global.atom.notifications.addInfo.mock.calls[0][0]).toBe(NOTIFICATION.WELCOME_MSG);
        const options = global.atom.notifications.addInfo.mock.calls[0][1];
        expect(options.buttons).toHaveLength(1);
        expect(options.buttons[0].text).toStrictEqual(NOTIFICATION.JOIN);
        expect(options.dismissable).toBe(true);
        fs.rmSync(userFilePath);
    });

    test('with user and repo not synced', async () => {
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
        const port = await setupCodeSync(repoPath);
        // should return port number
        expect(port).toBeTruthy();
        expect(global.atom.notifications.addInfo).toHaveBeenCalledTimes(1);
        expect(global.atom.notifications.addInfo.mock.calls[0][0]).toBe(NOTIFICATION.CONNECT_REPO);
        const options = global.atom.notifications.addInfo.mock.calls[0][1];
        expect(options.buttons).toHaveLength(2);
        expect(options.buttons[0].text).toStrictEqual(NOTIFICATION.CONNECT);
        expect(options.buttons[1].text).toStrictEqual(NOTIFICATION.IGNORE);
        expect(options.dismissable).toBe(true);
        fs.rmSync(userFilePath);
    });

    test('with synced repo',  async () => {
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
        fs.writeFileSync(configPath, yaml.safeDump(configData));
        const port = await setupCodeSync(repoPath);
        // should return port number
        expect(port).toBeFalsy();
        expect(global.atom.notifications.addInfo).toHaveBeenCalledTimes(1);
        expect(global.atom.notifications.addInfo.mock.calls[0][0]).toBe(NOTIFICATION.REPO_IN_SYNC);
        const options = global.atom.notifications.addInfo.mock.calls[0][1];
        expect(options.buttons).toHaveLength(2);
        expect(options.buttons[0].text).toStrictEqual(NOTIFICATION.TRACK_IT);
        expect(options.buttons[1].text).toStrictEqual(NOTIFICATION.UNSYNC_REPO);
        expect(options.dismissable).toBe(true);
        fs.rmSync(userFilePath);
    });

    test('showConnectRepoView',  async () => {
        global.atom.project.getPaths.mockReturnValueOnce([repoPath]);
        fs.writeFileSync(configPath, yaml.safeDump({repos: {}}));
        const shouldShowConnectRepoView = showConnectRepoView(repoPath);
        expect(shouldShowConnectRepoView).toBe(true);
    });
});


describe("showLogin",  () => {
    const baseRepoPath = randomBaseRepoPath();
    const userFilePath = `${baseRepoPath}/user.yml`;
    const userData = {"dummy_email": {access_token: "ABC"}};

    beforeEach(() => {
        jest.clearAllMocks();
        untildify.mockReturnValue(baseRepoPath);
        fs.mkdirSync(baseRepoPath, { recursive: true });
    });

    afterEach(() => {
        fs.rmdirSync(baseRepoPath, { recursive: true });
    });

    test('with no user.yml',   () => {
        const shouldShowLogin = showLogIn();
        expect(shouldShowLogin).toBe(true);
    });

    test('with empty user.yml',  async () => {
        fs.writeFileSync(userFilePath, yaml.safeDump({}));
        const shouldShowLogin = showLogIn();
        expect(shouldShowLogin).toBe(true);
        fs.rmSync(userFilePath);
    });

    test('with user',  async () => {
        fs.writeFileSync(userFilePath, yaml.safeDump(userData));
        const shouldShowLogin = showLogIn();
        expect(shouldShowLogin).toBe(false);
        fs.rmSync(userFilePath);
    });
});