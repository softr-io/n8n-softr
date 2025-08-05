import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { databaseRLC, tableRLC } from './common.descriptions';
import { searchDatabases, searchTables } from './listSearch';
import { getColumns } from './resourceMapping';
import { getRecordId, loadDatabaseId, loadTableId } from './helpers';
import { getRecords, getTableFields, getTableFieldsForSearch } from './loadOptions';
import {
	createRecord,
	deleteRecord,
	getManyRecords,
	getSingleRecord,
	updateRecord,
} from './database.actions';
import { createAppUser, deleteAppUser } from './application.actions';

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
						action: 'Manage database records',
						description: 'Manage database records',
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
						action: 'Create record',
						description: 'Create database record',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete record',
						description: 'Delete database record',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many records',
						description: 'Get many database records',
					},
					{
						name: 'Get One',
						value: 'getOne',
						action: 'Get one record',
						description: 'Get one database record',
					},
					{
						name: 'Update',
						value: 'update',
						action: 'Update record',
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
				...databaseRLC,
				displayOptions: {
					show: {
						resource: ['database'],
					},
				},
			},
			{
				...tableRLC,
				displayOptions: {
					show: {
						resource: ['database'],
					},
				},
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
						operation: ['create', 'update'],
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
				placeholder: 'e.g. www.example.com',
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
				placeholder: 'e.g. name@email.com',
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
				placeholder: 'e.g. John Doe',
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
		listSearch: {
			searchDatabases,
			searchTables,
		},
		resourceMapping: {
			getColumns,
		},
		loadOptions: {
			getTableFields,
			getTableFieldsForSearch,
			getRecords,
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
				const databaseId = loadDatabaseId.call(this);
				const tableId = loadTableId.call(this);

				if (operation === 'create') {
					response = await createRecord.call(this, databaseId, tableId, i, items[i]);
					returnData.push({ json: response.data });
				}
				if (operation === 'update') {
					let recordId = getRecordId.call(this, i);
					response = await updateRecord.call(this, databaseId, tableId, recordId, i, items[i]);
					returnData.push({ json: response.data });
				}
				if (operation === 'delete') {
					let recordId = getRecordId.call(this, i);
					response = await deleteRecord.call(this, databaseId, tableId, recordId);
					returnData.push({ json: response });
				}
				if (operation === 'getMany') {
					response = await getManyRecords.call(this, databaseId, tableId, i);
					response.data.forEach((record: any) => {
						returnData.push({ json: record });
					});
				}
				if (operation === 'getOne') {
					let recordId = getRecordId.call(this, i);
					response = await getSingleRecord.call(this, databaseId, tableId, recordId);
					returnData.push({ json: response.data });
				}
			}
			if (resource === 'appUser') {
				if (operation === 'createAppUser') {
					let response = await createAppUser.call(this, i);
					returnData.push({ json: response });
				}
				if (operation === 'deleteAppUser') {
					let response = await deleteAppUser.call(this, i);
					returnData.push({ json: response });
				}
			}
		}
		return [this.helpers.returnJsonArray(returnData)];
	}
}
