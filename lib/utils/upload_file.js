'use babel';

import fs from 'fs';
import fetch from "node-fetch";
import { isBinaryFileSync } from "isbinaryfile";
import { API_FILES } from "../constants";


export const uploadFile = async (token, data) => {
	let error = '';
	const response = await fetch(API_FILES, {
			method: 'post',
			body: JSON.stringify(data),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Basic ${token}`
			},
		}
	)
	.then(res => res.json())
	.then(json => json)
	.catch(err => error = err);

	return {
		response,
		error
	};
};

export const uploadFileTos3 = async (filePath, presignedUrl) => {
	let error = '';
	if (!fs.existsSync(filePath)) { return; }
	const content = fs.readFileSync(filePath);
	await fetch(presignedUrl.url, {
			method: 'post',
			body: content
		}
	)
	.then(res => res.json())
	.then(json => json)
	.catch(err => error = err);
};

export const uploadFileToServer = async (access_token, repoId, branch, filePath, relPath, created_at) => {
	/*
	Uplaods new file to server returns its ID
	*/
	// Get file info
	const fileInfo = fs.lstatSync(filePath);
	const isBinary = isBinaryFileSync(filePath);
	const data = {
		repo_id: repoId,
		branch: branch,
		is_binary: isBinary,
		size: fileInfo.size,
		file_path: relPath,
		created_at: created_at,
	};
	const json = await uploadFile(access_token, data);
	if (fileInfo.size && json.response.url) {
		await uploadFileTos3(filePath, json.response.presignedUrl);
	}
	return {
		error: json.error,
		fileId: json.response.id
	};
};
