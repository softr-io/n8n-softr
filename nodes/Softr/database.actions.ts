import {
	IExecuteFunctions,
	INodeExecutionData,
	IPollFunctions,
	NodeApiError,
	ResourceMapperFields,
} from 'n8n-workflow';
import { apiRequest } from './index';
import { getAllColumns } from './resourceMapping';

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

	let rawRecord = await apiRequest.call(
		this,
		'POST',
		`databases/${databaseId}/tables/${tableId}/records`,
		payload,
	);
	const fieldMap = await getFieldsMap.call(this, databaseId, tableId);
	return mapToFriendlyColumnsNames(rawRecord.data, fieldMap);
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

	let rawRecord = await apiRequest.call(
		this,
		'PATCH',
		`databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		payload,
	);
	const fieldMap = await getFieldsMap.call(this, databaseId, tableId);
	return mapToFriendlyColumnsNames(rawRecord.data, fieldMap);
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
	let rawRecord = await apiRequest.call(
		this,
		'GET',
		`databases/${databaseId}/tables/${tableId}/records/${recordId}`,
	);
	const fieldMap = await getFieldsMap.call(this, databaseId, tableId);
	return mapToFriendlyColumnsNames(rawRecord.data, fieldMap);
}

export async function getManyRecords(
	this: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	index: number,
): Promise<any> {
	const rawFilter = this.getNodeParameter('filter', index) as {
		condition?: {
			operator?: 'AND' | 'OR';
			conditions?: {
				condition?: Array<{
					leftSide: string;
					operator: string;
					rightSide?: string;
				}>;
			};
		};
	};

	const operator = rawFilter.condition?.operator ?? 'AND';
	const rawConditions = rawFilter.condition?.conditions?.condition ?? [];

	const paging = this.getNodeParameter('paging', 0) as {
		offset?: number;
		limit?: number;
		sortingField?: string;
		sortType?: string;
	};

	const payload = {
		filter: {
			condition: {
				operator,
				conditions: rawConditions,
			},
		},
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

	let rawRecords = await apiRequest.call(
		this,
		'POST',
		`databases/${databaseId}/tables/${tableId}/records/search`,
		payload,
	);

	const fieldMap = await getFieldsMap.call(this, databaseId, tableId);

	// Transform each record
	return (rawRecords.data || []).map((record: any) => {
		return mapToFriendlyColumnsNames(record, fieldMap);
	});
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

// Gets the field metadata for a given table in a database: field ID -> field label
export async function getFieldsMap(
	this: IExecuteFunctions | IPollFunctions,
	databaseId: string,
	tableId: string,
) {
	const columns: ResourceMapperFields = await getAllColumns.call(this, databaseId, tableId);
	// Build ID → label map
	const fieldMap: Record<string, string> = {};
	(columns.fields || []).forEach((field) => {
		fieldMap[field.id] = field.displayName || field.id;
	});
	return fieldMap;
}

export function mapToFriendlyColumnsNames(record: any, fieldMap: Record<string, string>) {
	const friendlyFields: Record<string, any> = {};

	for (const [fieldId, value] of Object.entries(record.fields || {})) {
		const label = fieldMap[fieldId] || fieldId;
		friendlyFields[label] = value;
	}

	return {
		id: record.id,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
		...friendlyFields,
	};
}
