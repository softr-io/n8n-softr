import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export const SOFTR_TABLES = 'https://tables-api.softr.io/api/v1';
export const SOFTR_STUDIO_USERS = 'https://studio-api.softr.io/v1/api/users';

export async function getDatabases(this: ILoadOptionsFunctions | IExecuteFunctions) {
	const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases`,
		json: true,
	});

	return response.data.map((db: any) => ({
		name: db.name,
		value: db.id,
	}));
}

export async function getTables(
	this: ILoadOptionsFunctions | IExecuteFunctions,
	databaseId: string,
) {
	if (!databaseId) {
		return [];
	}
	const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables`,
		json: true,
	});

	return response.data.map((table: any) => ({
		name: table.name,
		value: table.id,
	}));
}
