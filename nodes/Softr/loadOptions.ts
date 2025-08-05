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
