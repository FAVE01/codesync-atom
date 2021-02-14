'use babel';

import fs from 'fs';
import yaml from 'js-yaml';
import dateFormat from "dateformat";
import getBranchName from "current-git-branch";
import {diff_match_patch} from "diff-match-patch";
import ignore from 'ignore';

import {
  SHADOW_REPO,
  ORIGINALS_REPO,
  DIFFS_REPO,
  DIFF_SOURCE,
  DATETIME_FORMAT,
  DEFAULT_BRANCH,
  GIT_REPO
} from "./constants";

export function handleFileCreated(event) {
  const filePath = event.path;
  const repoPath = atom.project.getPaths()[0];
  const relPath = filePath.split(`${repoPath}/`)[1];
  if (!repoPath || shouldIgnoreFile(repoPath, relPath)) { return; }
  console.log(`FileCreated: ${filePath}`);
  const repoName = repoPath.split('/').pop();
  const branch = getBranchName({ altPath: repoPath });
  const destOriginals = `${ORIGINALS_REPO}/${repoName}/${branch}/${relPath}`;
  const destOriginalsPathSplit = destOriginals.split("/");
  const destOriginalsBasePath = destOriginalsPathSplit.slice(0, destOriginalsPathSplit.length-1).join("/");
  const destShadow = `${SHADOW_REPO}/${repoName}/${branch}/${relPath}`;
  const destShadowPathSplit = destShadow.split("/");
  const destShadowBasePath = destShadowPathSplit.slice(0, destShadowPathSplit.length-1).join("/");
  // Skip if file is already in .originals
  if (fs.existsSync(destOriginals)) { return; }
  // Add file in originals repo
  fs.mkdirSync(destOriginalsBasePath, { recursive: true });
  // File destination will be created or overwritten by default.
  fs.copyFileSync(filePath, destOriginals);
  // Add file in shadow repo
  fs.mkdirSync(destShadowBasePath, { recursive: true });
  // File destination will be created or overwritten by default.
  fs.copyFileSync(filePath, destShadow);
  // Add new diff in the buffer
  const newDiff = {};
  newDiff.repo = repoName;
  newDiff.branch = branch || DEFAULT_BRANCH;
  newDiff.file_relative_path = relPath;
  newDiff.is_new_file = true;
  newDiff.source = DIFF_SOURCE;
  newDiff.created_at = dateFormat(new Date(), DATETIME_FORMAT);
  // Append new diff in the buffer
  fs.writeFileSync(`${DIFFS_REPO}/${new Date().getTime()}.yml`, yaml.safeDump(newDiff));
}

export function handleFileDeleted(event) {
  const filePath = event.path;
  const repoPath = atom.project.getPaths()[0];
  const relPath = filePath.split(`${repoPath}/`)[1];
  if (!repoPath || shouldIgnoreFile(repoPath, relPath)) { return; }
  console.log(`FileDeleted: ${filePath}`);
  const repoName = repoPath.split('/').pop();
  const branch = getBranchName({ altPath: repoPath });
  // Add new diff in the buffer
  const newDiff = {};
  newDiff.repo = repoName;
  newDiff.branch = branch || DEFAULT_BRANCH;
  newDiff.file_relative_path = relPath;
  newDiff.is_deleted = true;
  newDiff.source = DIFF_SOURCE;
  newDiff.created_at = dateFormat(new Date(), DATETIME_FORMAT);
  // Append new diff in the buffer
  fs.writeFileSync(`${DIFFS_REPO}/${new Date().getTime()}.yml`, yaml.safeDump(newDiff));
}

export function handleFileRenamed(event) {
  const repoPath = atom.project.getPaths()[0];
  if (!repoPath) { return; }
  const oldAbsPath = event.oldPath;
  const newAbsPath = event.path;
  const oldRelPath = oldAbsPath.split(`${repoPath}/`)[1];
  const newRelPath = newAbsPath.split(`${repoPath}/`)[1];
  if (shouldIgnoreFile(repoPath, newRelPath)) { return; }
  console.log(`FileRenamed: ${oldAbsPath} -> ${newAbsPath}`);
  const repoName = repoPath.split('/').pop();
  const branch = getBranchName({ altPath: repoPath });
  // Add file in shadow repo
  const shadowPath = `${SHADOW_REPO}/${repoName}/${branch}/${newRelPath}`;
  const shadowPathSplit = shadowPath.split("/");
  const shadowBasePath = shadowPathSplit.slice(0, shadowPathSplit.length-1).join("/");
  // Add file in shadow repo
  fs.mkdirSync(shadowBasePath, { recursive: true });
  fs.copyFileSync(newAbsPath, shadowPath);
  // Add new diff in the buffer
  const newDiff = {};
  newDiff.repo = repoName;
  newDiff.branch = branch || DEFAULT_BRANCH;
  newDiff.file_relative_path = newRelPath;
  newDiff.is_rename = true;
  newDiff.source = DIFF_SOURCE;
  newDiff.created_at = dateFormat(new Date(), DATETIME_FORMAT);
  newDiff.diff = JSON.stringify({ old_abs_path: oldAbsPath, new_abs_path: newAbsPath,
    old_rel_path: oldRelPath, new_rel_path: newRelPath});
  // Append new diff in the buffer
  fs.writeFileSync(`${DIFFS_REPO}/${new Date().getTime()}.yml`, yaml.safeDump(newDiff));
}

export function handleChanges(editor) {
  const filePath = editor.getPath();
  const repoPath = atom.project.getPaths()[0];
  const relPath = filePath.split(`${repoPath}/`)[1];
  if (!repoPath || shouldIgnoreFile(repoPath, relPath)) { return; }
  const repoName = repoPath.split('/').pop();
  const text = editor.getText();
  const branch = getBranchName({ altPath: repoPath });
  const shadowPath = `${SHADOW_REPO}/${repoName}/${branch}/${relPath}`;
  const shadowExists = fs.existsSync(shadowPath);

  if (!shadowExists) {
    // TODO: Create shadow file?
    console.log('Skipping: Shadow does not exist');
    return;
  }
  // Read shadow file
  const shadowText = fs.readFileSync(shadowPath, "utf8");
  if (!shadowText) {
    console.log('Skipping: Empty Shadow');
  }
  // If shadow text is same as current content, no need to compute diffs
  // console.log('MathcingText: ', shadowText, shadowText === text)
  if (shadowText === text) {
    console.log('Skipping: Shadow is identical to content');
    return;
  }
  // Update shadow file
  fs.writeFile(shadowPath, text, function (err) {
    if (err) throw err;
  });
  // Compute diffs
  const dmp = new diff_match_patch();
  const patches = dmp.patch_make(shadowText, text);
  //  Create text representation of patches objects
  const diffs = dmp.patch_toText(patches);
  // Skip empty diffs
  if (!diffs) {
    console.log('Skipping: Diff is empty');
    return;
  }

  console.log(`Syncing: ${repoName}/${relPath}`);
  // Add new diff in the buffer
  const newDiff = {};
  newDiff.repo = repoName;
  newDiff.branch = branch || DEFAULT_BRANCH;
  newDiff.file_relative_path = relPath;
  newDiff.diff = diffs;
  newDiff.source = DIFF_SOURCE;
  newDiff.created_at = dateFormat(new Date(), 'UTC:yyyy-mm-dd HH:MM:ss.l');
  // Append new diff in the buffer
  fs.writeFileSync(`${DIFFS_REPO}/${new Date().getTime()}.yml`, yaml.safeDump(newDiff));
}

export function isGitFile(path) {
  return path.startsWith(GIT_REPO);
}

function shouldIgnoreFile(repoPath, relPath) {
  // Always ignore .git/
  if (isGitFile(relPath)) { return true; }
  const syncIgnorePath = `${repoPath}/.syncignore`;
  // TODO: See what to do if syncignore is not there
  if (!fs.existsSync(syncIgnorePath)) { return true; }
  const syncignorePaths = fs.readFileSync(syncIgnorePath, "utf8");
  const splitLines = syncignorePaths.split("\n");
  const ig = ignore().add(splitLines);
  const shouldIgnore = ig.ignores(relPath);
  if (shouldIgnore) { console.log(`Skipping syncignored file: ${relPath}`); }
  return shouldIgnore;
}