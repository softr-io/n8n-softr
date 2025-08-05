import { ILoadOptionsFunctions } from 'n8n-workflow';
import { apiRequest } from './index';
import { getDatabaseId, getTableId } from './helpers';

export async function getTableFieldsForSearch(this: ILoadOptionsFunctions) {
	const fields = await getTableFields.call(this);
	return [
		...fields,
		{ name: 'Created At (System)', value: 'created_at' },
		{ name: 'Updated At (System)', value: 'updated_at' },
	];
}

export async function getRecords(this: ILoadOptionsFunctions) {
	const databaseId = getDatabaseId.call(this);
	const tableId = getTableId.call(this);

	const primaryFieldId: string = await getPrimaryField.call(this, databaseId, tableId);

	const response = await apiRequest.call(
		this,
		'GET',
		`databases/${databaseId}/tables/${tableId}/records`,
	);

	return response.data.map((record: any) => ({
		name: record.fields[primaryFieldId] || record.id,
		value: record.id,
	}));
}

export async function getTableFields(
	this: ILoadOptionsFunctions,
): Promise<{ name: string; value: string }[]> {
	const databaseId = getDatabaseId.call(this);
	const tableId = getTableId.call(this);

	const response = await apiRequest.call(this, 'GET', `databases/${databaseId}/tables/${tableId}`);

	const fields = response.data?.fields ?? [];

	return fields.map((field: any) => ({
		name: field.name,
		value: field.id,
	}));
}

export async function getPrimaryField(
	this: ILoadOptionsFunctions,
	databaseId: string,
	tableId: string,
): Promise<string> {
	const responseData = await apiRequest.call(
		this,
		'GET',
		`databases/${databaseId}/tables/${tableId}`,
	);
	return responseData.data.primaryFieldId;
}
