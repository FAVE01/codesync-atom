'use babel';

import fs from 'fs';
import yaml from 'js-yaml';

import {CONFIG_PATH} from "./constants";
import {handleChanges, handleFileCreated, handleFileDeleted, handleFileRenamed} from "./utils";

export default {

  subscriptions: null,

  activate(state) {
    const repoPath = atom.project.getPaths()[0];
    if (!repoPath) { return; }
    console.log(`Configured repo: ${repoPath}`);

    atom.project.onDidChangeFiles(events => {
      for (const event of events) {
        // "created", "modified", "deleted", or "renamed"
        if (event.action === 'created') {
          handleFileCreated(event);
          return;
        }
        if (event.action === 'deleted') {
          handleFileDeleted(event);
          return;
        }
        if (event.action === 'renamed') {
          handleFileRenamed(event);
          return;
        }
      }
    });

    atom.workspace.observeTextEditors (function(editor) {
      const repoPath = atom.project.getPaths()[0];
      if (!repoPath) { return; }
      const repoName = repoPath.split('/').pop();
      // TODO: Show some alert to user
      // If config.yml does not exists, return
      const configExists = fs.existsSync(CONFIG_PATH);
      if (!configExists) { return; }
      // Return if user hasn't synced the repo
      try {
        const config = yaml.load(fs.readFileSync(CONFIG_PATH, "utf8"));
        if (!(repoName in config['repos']) || config['repos'][repoName].path !== repoPath) {
          console.log("Skipping non-synced repo")
          return;
        }
      } catch (e) {
        return;
      }
      // Register changes handler
      editor.onDidStopChanging(function(event) {
        handleChanges(editor);
      })
    })
  },

  deactivate() {
    this.subscriptions.dispose();
  }
};