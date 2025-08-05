import { IDataObject, ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { apiRequest } from './index';

export async function searchDatabases(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
	const response = await apiRequest.call(this, 'GET', 'databases');
	const data = (response.data ?? []) as IDataObject[];

	return {
		results: data.map((database: IDataObject) => ({
			name: database.name as string,
			value: database.id as string,
			url: `https://studio.softr.io/databases/${database.id}`,
		})),
	};
}

export async function searchTables(this: ILoadOptionsFunctions): Promise<INodeListSearchResult> {
	const databaseId = this.getNodeParameter('databaseId', undefined, {
		extractValue: true,
	}) as string;
	if (!databaseId) {
		return { results: [] };
	}

	const response = await apiRequest.call(this, 'GET', `databases/${databaseId}/tables`);
	const data = (response.data ?? []) as IDataObject[];

	return {
		results: data.map((table: IDataObject) => ({
			name: table.name as string,
			value: table.id as string,
			url: `https://studio.softr.io/databases/${databaseId}?table=${table.id}`,
		})),
	};
}
