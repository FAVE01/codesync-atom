import fs from "fs";
import path from "path";
import untildify from "untildify";

import {DIFF_SOURCE} from "../../lib/constants";
import { formatPath } from "../../lib/utils/path_utils";

export function getRandomString(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var result = '';
    for ( let i = 0; i < length; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}

export function randomName() {
    return getRandomString(10);
}

function randomBaseRepoName() {
    return `.codesync_${randomName()}`;
}

function randomRepoName() {
    return `test_repo_${randomName()}`;
}

export function randomBaseRepoPath() {
    const posixPath = path.join("tests", "tests_data", randomBaseRepoName());
    const windowPath = path.join("tests", "tests_data", "C:", randomBaseRepoName());
    const paths = [posixPath, windowPath];
    return paths[Math.floor(Math.random() * paths.length)];
}

export function randomRepoPath() {
    const posixPath = path.join("tests", "tests_data", randomRepoName());
    const windowPath = path.join("tests", "tests_data", "C:", randomRepoName());
    const paths = [posixPath, windowPath];
    return paths[Math.floor(Math.random() * paths.length)];
}

export async function waitFor(seconds) {
    return await new Promise((r) => setTimeout(r, seconds*1000));
}

export const buildAtomEnv = () => {
    global.atom = {
        views: {
            getView: jest.fn()
        },
        notifications: {
            addWarning: jest.fn(),
            addInfo: jest.fn(() => ({
                    dismiss: jest.fn()
            })),
            addError: jest.fn()
        },
        project: {
            getPaths: jest.fn()
        },
        workspace: {
            getActiveTextEditor: jest.fn()
        },
        menu: {
            add: jest.fn(),
            sortPackagesMenu: jest.fn()
        },
        contextMenu: {
            add: jest.fn()
        }
    };
};

export const PRE_SIGNED_URL = {
    'url': 'https://codesync.s3.amazonaws.com/',
    'fields': {
        'key': 'repos/1/codesync-intellij/master/gradle/wrapper/gradle-wrapper.jar',
        'AWSAccessKeyId': 'DUMMY_KEY',
        'policy': 'ABC POLICY',
        'signature': 'enz87g3VP0fxp/sCehLWsNZ4KRE='
    }
};

export const TEST_EMAIL = 'test@codesync.com';
export const ANOTHER_TEST_EMAIL = 'anotherTest@codesync.com';
export const INVALID_TOKEN_JSON = {"error": "Invalid token"};
export const SYNC_IGNORE_DATA = ".DS_Store\n.git\n\n\n.node_modules\n";
export const DUMMY_FILE_CONTENT = "DUMMY FILE CONTENT";

export const USER_PLAN = {
    "SIZE": 10 * 1000 * 1000,  // 10 MB
    "FILE_COUNT": 100,
    "REPO_COUNT": 5
};

export const TEST_USER = {
    email: TEST_EMAIL,
    iam_access_key: "iam_access_key",
    iam_secret_key: "iam_secret_key",
};

export const TEST_REPO_RESPONSE = {
    'repo_id': 123,
    'branch_id': 456,
    'file_path_and_id': {
        "file_1": 1,
        "directory/file_2": 2,
    },
    'urls': {
        "file_1": PRE_SIGNED_URL,
        "directory/file_2": PRE_SIGNED_URL,
    },
    'user': TEST_USER
};

export const DIFF_DATA = {
    repo_path: "",
    branch: "",
    file_relative_path: "",
    created_at: "",
    diff: null,
    source: DIFF_SOURCE
};

export function getConfigFilePath(baseRepoPath) {
    const formattedPath = formatPath(baseRepoPath);
    untildify.mockReturnValue(formattedPath);
    return path.join(formattedPath, "config.yml");
}

export function getUserFilePath(baseRepoPath) {
    const formattedPath = formatPath(baseRepoPath);
    untildify.mockReturnValue(formattedPath);
    return path.join(formattedPath, "user.yml");
}

export function getSeqTokenFilePath(baseRepoPath) {
    const formattedPath = formatPath(baseRepoPath);
    untildify.mockReturnValue(formattedPath);
    return path.join(formattedPath, "sequence_token.yml");
}

export function getSyncIgnoreFilePath(repoPath) {
    const formattedPath = formatPath(repoPath);
    return path.join(formattedPath, ".syncignore");
}

export function mkDir(dirPath) {
    const formattedPath = formatPath(dirPath);
    fs.mkdirSync(formattedPath, {recursive: true});
}

export function rmDir(dirPath) {
    const formattedPath = formatPath(dirPath);
    fs.rmSync(formattedPath, { recursive: true, force: true });
}

export function writeFile(filePath, data) {
    const formattedPath = formatPath(filePath);
    fs.writeFileSync(formattedPath, data);
}
