import { ILoadOptionsFunctions, ResourceMapperField, ResourceMapperFields } from 'n8n-workflow';
import { apiRequest } from './index';
import { getDatabaseId, getTableId } from './helpers';

export async function getColumns(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const databaseId = getDatabaseId.call(this);
	const tableId = getTableId.call(this);

	const response = await apiRequest.call(this, 'GET', `databases/${databaseId}/tables/${tableId}`);

	const fields = (response.data?.fields ?? []) as any[];

	return {
		fields: fields
			.filter((field) => !field.readonly)
			.map((field) => {
				let displayName = `${field.name} (#${field.id}) - ${field.type}`;
				let type = 'string';
				if (field.allowMultipleEntries && field.type !== 'ATTACHMENT') {
					type = 'array';
				}
				return {
					id: field.id,
					displayName: displayName,
					defaultMatch: false,
					required: field.required ?? false,
					display: true,
					type: type,
				} as ResourceMapperField;
			}),
	};
}
