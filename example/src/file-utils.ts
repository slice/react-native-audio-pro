import { Image, Platform } from 'react-native';

import RNFS, { exists, mkdir, copyFile, CachesDirectoryPath } from 'react-native-fs';

import {
	AUDIO_CACHE_FOLDER,
	AUDIO_CACHE_FILENAME,
	ARTWORK_CACHE_FOLDER,
	ARTWORK_CACHE_FILENAME,
} from './playlist';

async function copyFileToCache(
	sourceFile: number,
	cacheFolder: string,
	cacheFilename: string,
): Promise<void> {
	try {
		// Create the destination directory if it doesn't exist
		const cacheFolderPath = `${CachesDirectoryPath}/${cacheFolder}`;
		const folderExists = await exists(cacheFolderPath);

		if (!folderExists) {
			await mkdir(cacheFolderPath);
		}

		// Get the source file path from the require result
		const resolvedSource = Image.resolveAssetSource(sourceFile);
		const sourceFilePath = resolvedSource.uri;

		// Define the destination path
		const destinationPath = `${cacheFolderPath}/${cacheFilename}`;

		// Check if the file already exists in the cache
		const fileExists = await exists(destinationPath);
		if (fileExists) {
			console.log(`File already exists in cache: ${destinationPath}`);
		} else {
			console.log(`File does not exist in cache: ${destinationPath}`);
		}

		if (!fileExists) {
			// For development builds, we need to download the file from the dev server
			if (
				sourceFilePath.includes('10.0.2.2:8081') ||
				sourceFilePath.includes('localhost:8081')
			) {
				console.log('Downloading file from dev server:', sourceFilePath);
				try {
					// Use downloadFile instead of copyFile for URLs
					const result = await RNFS.downloadFile({
						fromUrl: sourceFilePath,
						toFile: destinationPath,
					}).promise;
					if (result.statusCode !== 200) {
						throw new Error(`Download failed with status code ${result.statusCode}`);
					}
				} catch (downloadError) {
					console.error('Error downloading file:', downloadError);
					throw downloadError;
				}
			} else if (Platform.OS === 'android' && sourceFilePath.startsWith('file:///')) {
				// On Android, remove the file:// prefix for RNFS
				const androidSourcePath = sourceFilePath.replace('file://', '');
				await copyFile(androidSourcePath, destinationPath);
			} else {
				await copyFile(sourceFilePath, destinationPath);
			}

			console.log(`File copied to cache: ${destinationPath}`);
		} else {
			console.log(`File already exists in cache: ${destinationPath}`);
		}
	} catch (error) {
		console.error('Error copying file to cache:', error);
		throw error;
	}
}

export async function copyAudioToCache(sourceFile: number): Promise<void> {
	return copyFileToCache(sourceFile, AUDIO_CACHE_FOLDER, AUDIO_CACHE_FILENAME);
}

export async function copyArtworkToCache(sourceFile: number): Promise<void> {
	return copyFileToCache(sourceFile, ARTWORK_CACHE_FOLDER, ARTWORK_CACHE_FILENAME);
}
