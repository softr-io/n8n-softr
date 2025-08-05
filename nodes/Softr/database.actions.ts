import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { apiRequest } from './index';

export async function createRecord(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	index: number,
	item: INodeExecutionData,
): Promise<any> {
	let fields = this.getNodeParameter('fields', index) as {
		value: any;
		schema: any[];
		mappingMode: string;
	};
	let data =
		fields.mappingMode === 'autoMapInputData'
			? filterFields(item.json, fields.schema)
			: fields.value;

	const payload = { fields: data };

	return await apiRequest.call(
		this,
		'POST',
		`databases/${databaseId}/tables/${tableId}/records`,
		payload,
	);
}

export async function updateRecord(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
	index: number,
	item: INodeExecutionData,
): Promise<any> {
	let fields = this.getNodeParameter('fields', index) as {
		value: any;
		schema: any[];
		mappingMode: string;
	};
	let data =
		fields.mappingMode === 'autoMapInputData'
			? filterFields(item.json, fields.schema)
			: fields.value;

	const payload = { fields: data };

	return await apiRequest.call(
		this,
		'PATCH',
		`databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		payload,
	);
}

export async function deleteRecord(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
): Promise<any> {
	const successResponse = { deleted: true };
	try {
		await apiRequest.call(
			this,
			'DELETE',
			`databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		);
		return successResponse;
	} catch (error: any) {
		const statusCode = error?.httpCode || error?.statusCode || error?.response?.statusCode;
		if (Number(statusCode) === 404) {
			// Idempotent success
			return successResponse;
		}
		throw new NodeApiError(this.getNode(), error);
	}
}

export async function getSingleRecord(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
): Promise<any> {
	return await apiRequest.call(
		this,
		'GET',
		`databases/${databaseId}/tables/${tableId}/records/${recordId}`,
	);
}

export async function getManyRecords(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	index: number,
): Promise<any> {
	const filter = this.getNodeParameter('filter', index) as {
		condition?: {
			operator?: string;
			leftSide?: string;
			rightSide?: string;
		};
	};
	const paging = this.getNodeParameter('paging', 0) as {
		offset?: number;
		limit?: number;
		sortingField?: string;
		sortType?: string;
	};

	const payload = {
		filter: filter,
		paging: {
			offset: paging.offset ?? 0,
			limit: paging.limit ?? 50,
		},
		sorting: [
			{
				sortingField: paging.sortingField ?? 'created_at',
				sortType: paging.sortType ?? 'ASC',
			},
		],
	};

	return await apiRequest.call(
		this,
		'POST',
		`databases/${databaseId}/tables/${tableId}/records/search`,
		payload,
	);
}

function filterFields(previous: any, schema: any[]) {
	const payload: Record<string, any> = {};
	for (const field of schema) {
		const fieldId = field.id;
		if (Object.prototype.hasOwnProperty.call(previous.fields, fieldId)) {
			payload[fieldId] = previous.fields[fieldId];
		}
	}
	return payload;
}
