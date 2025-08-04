import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	NodeApiError,
	NodeConnectionType,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';
import { getDatabases, getTables, SOFTR_STUDIO_USERS, SOFTR_TABLES } from './softr.helpers';

export class Softr implements INodeType {
	description: INodeTypeDescription = {
		name: 'softr',
		displayName: 'Softr',
		icon: 'file:softr.svg',
		group: ['input'],
		version: 1,
		description: 'Softr.io Integration Node',
		defaults: {
			name: 'Softr',
		},
		credentials: [
			{
				name: 'softrApi',
				required: true,
			},
		],
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Database Record',
						value: 'database',
						action: 'Manage records',
						description: 'Manage Database records',
					},
					{
						name: 'Application User',
						value: 'appUser',
						action: 'Manage application users',
						description: 'Manage application users',
					},
				],
				default: 'database',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['database'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						action: 'Create',
						description: 'Create database record',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete',
						description: 'Delete database record',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many',
						description: 'Get many database records',
					},
					{
						name: 'Get One',
						value: 'getOne',
						action: 'Get one',
						description: 'Get one database record',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update',
						description: 'Update database record',
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['appUser'],
					},
				},
				options: [
					{
						name: 'Create Application User',
						value: 'createAppUser',
						action: 'Create application user',
						description: 'Create an application user',
					},
					{
						name: 'Delete Application User',
						value: 'deleteAppUser',
						action: 'Delete application user',
						description: 'Delete an application user',
					},
				],
				default: 'createAppUser',
			},
			{
				displayName: 'Database Name or ID',
				name: 'databaseId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getDatabases',
				},
				displayOptions: {
					show: {
						resource: ['database'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Table Name or ID',
				name: 'tableId',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getTables',
					loadOptionsDependsOn: ['databaseId'],
				},
				displayOptions: {
					show: {
						resource: ['database'],
					},
				},
				default: '',
				required: true,
			},
			{
				displayName: 'Record Name or ID',
				name: 'recordId',
				type: 'options',
				required: true,
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getRecords',
					loadOptionsDependsOn: ['databaseId', 'tableId'],
				},
				default: '',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['getOne', 'delete', 'update'],
					},
				},
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'resourceMapper',
				default: {},
				typeOptions: {
					loadOptionsDependsOn: ['databaseId', 'tableId'],
					resourceMapper: {
						mode: 'add',
						resourceMapperMethod: 'getColumns',
					},
				},
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'resourceMapper',
				default: {},
				typeOptions: {
					loadOptionsDependsOn: ['databaseId', 'tableId'],
					resourceMapper: {
						mode: 'map',
						resourceMapperMethod: 'getColumns',
					},
				},
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['update'],
					},
				},
			},
			{
				displayName: 'Filter',
				name: 'filter',
				type: 'fixedCollection',
				description: 'Filter conditions to apply when searching for records',
				placeholder: 'Add filter condition',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				options: [
					{
						name: 'condition',
						displayName: 'Condition',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'leftSide',
								type: 'options',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
								typeOptions: {
									loadOptionsMethod: 'getTableFields',
									loadOptionsDependsOn: ['databaseId', 'tableId'],
								},
								default: '',
							},
							{
								displayName: 'Operator',
								default: 'IS',
								name: 'operator',
								options: [
									{ name: 'Contains', value: 'CONTAINS' },
									{ name: 'Does Not Contain', value: 'DOES_NOT_CONTAIN' },
									{ name: 'Equals', value: 'IS' },
									{ name: 'Greater Than', value: 'GREATER_THAN' },
									{ name: 'Greater Than Or Equals', value: 'GREATER_THAN_OR_EQUALS' },
									{ name: 'Is Empty', value: 'IS_EMPTY' },
									{ name: 'Is Not Empty', value: 'IS_NOT_EMPTY' },
									{ name: 'Less Than', value: 'LESS_THAN' },
									{ name: 'Less Than Or Equals', value: 'LESS_THAN_OR_EQUALS' },
									{ name: 'Not Equals', value: 'IS_NOT' },
								],
								type: 'options',
							},
							{
								displayName: 'Value',
								name: 'rightSide',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										operator: [
											'CONTAINS',
											'DOES_NOT_CONTAIN',
											'IS',
											'IS_NOT',
											'GREATER_THAN',
											'GREATER_THAN_OR_EQUALS',
											'LESS_THAN',
											'LESS_THAN_OR_EQUALS',
										],
									},
								},
							},
						],
					},
				],
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Domain',
				name: 'domain',
				description:
					'Either your custom domain (e.g. `www.example.com`) or Softr subdomain (e.g. `subdomain.softr.app`).',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['appUser'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				description: 'Email address of the application user to create or delete',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['appUser'],
					},
				},
			},
			{
				displayName: 'Full Name',
				name: 'fullName',
				description: 'Full Name of the application user to create',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['appUser'],
						operation: ['createAppUser'],
					},
				},
			},
			{
				displayName: 'Initial Password',
				name: 'initialPassword',
				description: 'Initial Password of the application user to create',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				displayOptions: {
					show: {
						resource: ['appUser'],
						operation: ['createAppUser'],
					},
				},
			},
			{
				displayName: 'Generate Magic Link',
				name: 'magicLink',
				description: 'Whether generate Magic Link for the application user to create',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['appUser'],
						operation: ['createAppUser'],
					},
				},
			},
			{
				displayName: 'Paging & Sorting',
				name: 'paging',
				type: 'collection',
				displayOptions: {
					show: {
						resource: ['database'],
						operation: ['getMany'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'How many items to skip before starting to collect the result set',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 50,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Sorting Field Name or ID',
						name: 'sortingField',
						type: 'options',
						description:
							'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
						typeOptions: {
							loadOptionsMethod: 'getTableFieldsForSearch',
							loadOptionsDependsOn: ['databaseId', 'tableId'],
						},
						default: '',
					},
					{
						displayName: 'Sorting Direction',
						name: 'sortType',
						type: 'options',
						options: [
							{ name: 'Ascending', value: 'ASC' },
							{ name: 'Descending', value: 'DESC' },
						],
						default: 'ASC',
					},
				],
			},
		],
	};

	methods = {
		resourceMapping: {
			async getColumns(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				return getColumns.call(this);
			},
		},

		loadOptions: {
			async getDatabases(this: ILoadOptionsFunctions) {
				return getDatabases.call(this);
			},

			async getTables(this: ILoadOptionsFunctions) {
				const databaseId = this.getNodeParameter('databaseId') as string;
				return getTables.call(this, databaseId);
			},

			async getTableFields(this: ILoadOptionsFunctions) {
				return getTableFields.call(this);
			},

			async getTableFieldsForSearch(this: ILoadOptionsFunctions) {
				const fields = await getTableFields.call(this);
				return [
					...fields,
					{ name: 'Created At (System)', value: 'created_at' },
					{ name: 'Updated At (System)', value: 'updated_at' },
				];
			},

			async getRecords(this: ILoadOptionsFunctions) {
				const databaseId = this.getNodeParameter('databaseId') as string;
				const tableId = this.getNodeParameter('tableId') as string;

				const primaryFieldId: string = await getPrimaryField(this, databaseId, tableId);

				const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', {
					method: 'GET',
					url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records`,
					json: true,
				});

				return response.data.map((record: any) => ({
					name: record.fields[primaryFieldId] || record.id,
					value: record.id,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let response;
		const returnData = [];
		const resource = this.getNodeParameter('resource', 0, null) as string;
		const operation = this.getNodeParameter('operation', 0, null) as string;

		if (!resource || !operation) {
			return [];
		}

		for (let i = 0; i < items.length; i++) {
			if (resource === 'database') {
				const databaseId = this.getNodeParameter('databaseId', i) as string;
				const tableId = this.getNodeParameter('tableId', i) as string;
				if (operation === 'create') {
					response = await createRecord(this, databaseId, tableId, i, items[i]);
					returnData.push({ json: response.data });
				} else if (operation === 'update') {
					let recordId = this.getNodeParameter('recordId', i) as string;
					response = await updateRecord(this, databaseId, tableId, recordId, i, items[i]);
					returnData.push({ json: response.data });
				} else if (operation === 'delete') {
					let recordId = this.getNodeParameter('recordId', i) as string;
					response = await deleteRecord(this, databaseId, tableId, recordId);
					returnData.push({ json: response });
				} else if (operation === 'getMany') {
					response = await getManyRecords(this, databaseId, tableId, i);
					response.data.forEach((record: any) => {
						returnData.push({ json: record });
					});
				} else if (operation === 'getOne') {
					const recordId = this.getNodeParameter('recordId', i) as string;
					response = await getSingleRecord(this, databaseId, tableId, recordId);
					returnData.push({ json: response.data });
				}
			} else if (resource === 'appUser') {
				if (operation === 'createAppUser') {
					let response = await createAppUser(this, i);
					returnData.push({ json: response });
				} else if (operation === 'deleteAppUser') {
					let response = await deleteAppUser(this, i);
					returnData.push({ json: response });
				}
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}

async function createAppUser(context: IExecuteFunctions, index: number): Promise<any> {
	const payload: IRequestOptions = {
		method: 'POST',
		url: `${SOFTR_STUDIO_USERS}`,
		headers: {
			'Content-Type': 'application/json',
			'Softr-Domain': context.getNodeParameter('domain', index) as string,
		},
		body: {
			full_name: context.getNodeParameter('fullName', index) as string,
			email: context.getNodeParameter('email', index) as string,
			password: context.getNodeParameter('initialPassword', index) as string,
			generate_magic_link: context.getNodeParameter('magicLink', index) as boolean,
		},
		json: true,
	};

	return context.helpers.requestWithAuthentication.call(context, 'softrApi', payload);
}

async function createRecord(
	context: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	index: number,
	item: INodeExecutionData,
): Promise<any> {
	let fields = context.getNodeParameter('fields', index) as {
		value: any;
		schema: any[];
		mappingMode: string;
	};
	let data =
		fields.mappingMode === 'autoMapInputData'
			? filterFields(item.json, fields.schema)
			: fields.value;

	const payload = { fields: data };

	return context.helpers.requestWithAuthentication.call(context, 'softrApi', {
		method: 'POST',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records`,
		headers: { 'Content-Type': 'application/json' },
		body: payload,
		json: true,
	});
}

export function filterFields(previous: any, schema: any[]) {
	const payload: Record<string, any> = {};
	for (const field of schema) {
		const fieldId = field.id;
		if (Object.prototype.hasOwnProperty.call(previous.fields, fieldId)) {
			payload[fieldId] = previous.fields[fieldId];
		}
	}
	return payload;
}

async function updateRecord(
	context: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
	index: number,
	item: INodeExecutionData,
): Promise<any> {
	let fields = context.getNodeParameter('fields', index) as {
		value: any;
		schema: any[];
		mappingMode: string;
	};
	let data =
		fields.mappingMode === 'autoMapInputData'
			? filterFields(item.json, fields.schema)
			: fields.value;

	const payload = { fields: data };

	return await context.helpers.requestWithAuthentication.call(context, 'softrApi', {
		method: 'PATCH',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		headers: { 'Content-Type': 'application/json' },
		body: payload,
		json: true,
	});
}

async function deleteRecord(
	context: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
): Promise<any> {
	const successResponse = {
		success: true,
		message: `Record ${recordId} deleted successfully.`,
		recordId,
	};
	try {
		await context.helpers.requestWithAuthentication.call(context, 'softrApi', {
			method: 'DELETE',
			url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		});
		return successResponse;
	} catch (error: any) {
		const statusCode = error?.httpCode || error?.statusCode || error?.response?.statusCode;
		if (statusCode == 404) {
			// Idempotent success
			return successResponse;
		}
		throw new NodeApiError(context.getNode(), error);
	}
}

async function deleteAppUser(context: IExecuteFunctions, index: number): Promise<any> {
	const successResponse = { success: true, message: `User deleted successfully` };
	const email = context.getNodeParameter('email', index) as string;
	const domain = context.getNodeParameter('domain', index) as string;
	let payload: IRequestOptions = {
		method: 'DELETE',
		url: `${SOFTR_STUDIO_USERS}/${email}`,
		headers: { 'Softr-Domain': domain },
	};
	try {
		await context.helpers.requestWithAuthentication.call(context, 'softrApi', payload);
	} catch (error: any) {
		const statusCode = error?.httpCode || error?.statusCode || error?.response?.statusCode;
		if (statusCode == 404) {
			// Idempotent success
			return successResponse;
		}
		throw new NodeApiError(context.getNode(), error);
	}
	return successResponse;
}

async function getSingleRecord(
	context: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	recordId: string,
): Promise<any> {
	return await context.helpers.requestWithAuthentication.call(context, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records/${recordId}`,
		json: true,
	});
}

async function getManyRecords(
	context: IExecuteFunctions,
	databaseId: string,
	tableId: string,
	index: number,
): Promise<any> {
	const filter = context.getNodeParameter('filter', index) as {
		condition?: {
			operator?: string;
			leftSide?: string;
			rightSide?: string;
		};
	};
	const paging = context.getNodeParameter('paging', 0) as {
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

	return await context.helpers.requestWithAuthentication.call(context, 'softrApi', {
		method: 'POST',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}/records/search`,
		headers: { 'Content-Type': 'application/json' },
		body: payload,
		json: true,
	});
}

async function getPrimaryField(
	context: ILoadOptionsFunctions,
	databaseId: string,
	tableId: string,
): Promise<string> {
	const responseData = await context.helpers.requestWithAuthentication.call(context, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}`,
		json: true,
	});
	return responseData.data.primaryFieldId;
}

async function getTableFields(
	this: ILoadOptionsFunctions,
): Promise<{ name: string; value: string }[]> {
	const databaseId = this.getNodeParameter('databaseId') as string;
	const tableId = this.getNodeParameter('tableId') as string;

	const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}`,
		json: true,
	});

	const fields = response.data?.fields ?? [];

	return fields.map((field: any) => ({
		name: field.name,
		value: field.id,
	}));
}

export async function getColumns(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const databaseId = this.getNodeParameter('databaseId') as string;
	const tableId = this.getNodeParameter('tableId') as string;

	const response = await this.helpers.requestWithAuthentication.call(this, 'softrApi', {
		method: 'GET',
		url: `${SOFTR_TABLES}/databases/${databaseId}/tables/${tableId}`,
		json: true,
	});

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
