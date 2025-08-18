import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';
import { apiRequest } from './index';
import { getDatabaseId, getTableId } from './helpers';

export async function getColumns(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const databaseId = getDatabaseId.call(this);
	const tableId = getTableId.call(this);

	const fields: ResourceMapperField[] = await getAllFields.call(this, databaseId, tableId,);
	let filteredFields = fields.filter((field) => !field.readOnly);
	return { fields: filteredFields };
}

export async function getAllColumns(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	databaseId: string,
	tableId: string,
): Promise<ResourceMapperFields> {
	const allColumns = await getAllFields.call(this, databaseId, tableId);
	return { fields: allColumns };
}

async function getAllFields(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	databaseId: string,
	tableId: string,
): Promise<ResourceMapperField[]> {
	const response = await apiRequest.call(this, 'GET', `databases/${databaseId}/tables/${tableId}`);

	const fields = (response.data?.fields ?? []) as any[];

	return fields.map((field) => {
		let type = 'string';
		if (field.allowMultipleEntries && field.type !== 'ATTACHMENT') {
			type = 'array';
		}
		return {
			id: field.id,
			displayName: field.name,
			defaultMatch: false,
			required: field.required ?? false,
			display: true,
			type: type,
			readOnly: field.readonly,
		} as ResourceMapperField;
	});
}
