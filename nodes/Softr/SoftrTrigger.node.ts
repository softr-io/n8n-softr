import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	NodeConnectionType,
} from 'n8n-workflow';
import { apiRequest } from './index';
import { databaseRLC, tableRLC } from './common.descriptions';
import { searchDatabases, searchTables } from './listSearch';
import { getDatabaseId, getTableId } from './helpers';
import { getFieldsMap, mapToFriendlyColumnsNames } from './database.actions';

export class SoftrTrigger implements INodeType {
	description: INodeTypeDescription = {
		name: 'softrTrigger',
		displayName: 'Softr Trigger',
		icon: 'file:softr.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers when a Softr record is created or updated',
		subtitle: '={{$parameter["event"]}}',
		defaults: {
			name: 'Softr Trigger',
		},
		credentials: [
			{
				name: 'softrApi',
				required: true,
			},
		],
		polling: true,
		inputs: [],
		outputs: [NodeConnectionType.Main],
		properties: [
			databaseRLC,
			tableRLC,
			{
				displayName: 'Trigger On',
				name: 'eventType',
				type: 'options',
				description: 'Select the type of event to trigger on',
				options: [
					{
						name: 'Created Records',
						value: 'created',
						description: 'Trigger on new records in database',
					},
					{
						name: 'Updated Records',
						value: 'updated',
						description: 'Trigger on records update in database',
					},
				],
				default: 'created',
			},
			{
				displayName: 'Start Polling From',
				name: 'startTime',
				type: 'dateTime',
				default: '',
				required: true,
				description: 'Pick date and time to start polling from',
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
		],
	};

	methods = {
		listSearch: {
			searchDatabases,
			searchTables,
		},
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const databaseId = getDatabaseId.call(this);
		const tableId = getTableId.call(this);
		const eventType = this.getNodeParameter('eventType') as 'created' | 'updated';

		// read static data
		const staticData = this.getWorkflowStaticData('node');

		let payload: IDataObject;
		if (this.getMode() === 'manual') {
			// manual mode -> get the most recent record
			payload = {
				paging: { offset: 0, limit: 1 },
				sorting: [{ sortingField: 'created_at', sortType: 'DESC' }],
			};
		} else {
			// polling mode
			const field = eventType === 'created' ? 'created_at' : 'updated_at';
			const limit = this.getNodeParameter('limit') as number;
			const startTime = new Date(this.getNodeParameter('startTime') as string).getTime();
			const pollingStartTime = (staticData.lastTimeChecked || startTime) as number;
			payload = {
				filter: {
					condition: {
						operator: 'GREATER_THAN',
						leftSide: field,
						rightSide: pollingStartTime,
					},
				},
				paging: { offset: 0, limit: limit },
				sorting: [{ sortingField: field, sortType: 'ASC' }],
			};
		}
		const records = await pollRecords.call(this, databaseId, tableId, payload);

		if (Array.isArray(records) && records.length) {
			// Update lastTimeChecked with the maximum timestamp from the records
			if (this.getMode() !== 'manual') {
				staticData.lastTimeChecked = getMaxTimestamp(records, eventType);
			}
			return [this.helpers.returnJsonArray(records)];
		} else {
			return null;
		}
	}
}

// get max created_at / updated_at timestamp from the records
function getMaxTimestamp(data: any[], eventType: string): number {
	// response fields are formated in camelCase
	const field = eventType === 'created' ? 'createdAt' : 'updatedAt';
	// get max ISO timestamp from the records and format to milliseconds
	return Math.max(...data.map((r) => new Date(r[field]).getTime()));
}

async function pollRecords(
	this: IPollFunctions,
	databaseId: string,
	tableId: string,
	payload: any,
): Promise<any> {
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
