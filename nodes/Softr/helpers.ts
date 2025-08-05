import { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

export function getDatabaseId(this: ILoadOptionsFunctions): string {
	return this.getNodeParameter('databaseId', undefined, { extractValue: true, }) as string;
}

export function loadDatabaseId(this: IExecuteFunctions): string {
	return this.getNodeParameter('databaseId', 0, undefined, { extractValue: true, }) as string;
}

export function getTableId(this: ILoadOptionsFunctions): string {
	return this.getNodeParameter('tableId', undefined, {
		extractValue: true,
	}) as string;
}

export function loadTableId(this: IExecuteFunctions): string {
	return this.getNodeParameter('tableId', 0, undefined, {
		extractValue: true,
	}) as string;
}

export function getRecordId(this: IExecuteFunctions, i: number): string {
	return this.getNodeParameter('recordId', i) as string
}
