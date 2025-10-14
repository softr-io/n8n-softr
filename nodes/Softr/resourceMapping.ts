import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	ResourceMapperField,
	ResourceMapperFields,
} from 'n8n-workflow';
import { apiRequest } from './index';
import { getDatabaseId, getTableId } from './helpers';
import { INodePropertyOptions } from 'n8n-workflow/dist/Interfaces';

export async function getColumns(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
	const databaseId = getDatabaseId.call(this);
	const tableId = getTableId.call(this);

	const fields: ResourceMapperField[] = await getAllFields.call(this, databaseId, tableId);
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

/**
 *             {
 *                 "id": "q8ygc",
 *                 "name": "Status",
 *                 "type": "SELECT",
 *                 "options": {
 *                     "choices": [
 *                         {
 *                             "id": "f1038708-102e-47bb-a1e0-8ac6a4ec8345",
 *                             "label": "Todo",
 *                             "color": "#24A37D"
 *                         },
 *                         {
 *                             "id": "2ff1dc23-3dc0-4a7d-9cfb-11dba9debcac",
 *                             "label": "In progress",
 *                             "color": "#EB721B"
 *                         },
 *                         {
 *                             "id": "79c502d1-0b94-4264-8e9d-ec14b7816645",
 *                             "label": "Done",
 *                             "color": "#F53878"
 *                         }
 *                     ],
 *                     "allowToAddNewChoice": true,
 *                     "multiColorMode": true,
 *                     "sorting": "CUSTOM",
 *                     "enforceOrder": false
 *                 },
 *                 "allowMultipleEntries": true,
 *                 "readonly": false,
 *                 "required": false,
 *                 "locked": false,
 *                 "defaultValue": null,
 *                 "createdAt": "2025-08-01T11:19:59.226Z",
 *                 "updatedAt": "2025-09-01T07:48:05.170Z"
 * @param databaseId
 * @param tableId
 */
async function getAllFields(
	this: IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions,
	databaseId: string,
	tableId: string,
): Promise<ResourceMapperField[]> {
	const response = await apiRequest.call(this, 'GET', `databases/${databaseId}/tables/${tableId}`);

	const fields = (response.data?.fields ?? []) as any[];

	return fields.map((field) => {
		// map choices to options
		const options: INodePropertyOptions[] = [];
		field.options?.choices?.forEach((option: { id: string; label: string }) => {
			options.push({
				name: option.label,
				value: option.id,
			});
		});

		// if id
		const type = getType(field);
		return {
			id: field.id,
			displayName: field.name + ' - ' + type,
			defaultMatch: false,
			required: field.required ?? false,
			display: true,
			options: options,
			type: type,
			readOnly: field.readonly,
		} as ResourceMapperField;
	});
}

/*
export type FieldTypeMap = {
    boolean: boolean;
    number: number;
    string: string;
    'string-alphanumeric': string;
    dateTime: string;
    time: string;
    array: unknown[];
    object: object;
    options: any;
    url: string;
    jwt: string;
    'form-fields': FormFieldsParameter;
};
 */
function getType(field: any): string {
	// if (field.allowMultipleEntries && field.type !== 'ATTACHMENT') {
	// 	return 'array';
	// }
	// TODO-Darek: TEST ALL TYPES:
	// 'SINGLE_LINE_TEXT'
	// 'NUMBER'
	// 'CURRENCY'
	// 'LINKED_RECORD'
	// 'LONG_TEXT'
	// 'SELECT'
	// 'PERCENT'
	// 'DURATION'
	// 'RATING'
	// 'PROGRESS'
	// 'DATETIME'
	// 'BUTTON'
	// 'CHECKBOX'
	// 'EMAIL'
	// 'URL'
	// 'ATTACHMENT'
	// 'PHONE'
	// 'ADDRESS'
	// 'TIME'
	// 'DATE_RANGE'
	// 'LOOKUP'
	// 'ROLLUP'
	// 'FORMULA'
	// 'COUNT'
	// 'CREATED_AT'
	// 'UPDATED_AT'
	// 'CREATED_BY'
	// 'UPDATED_BY'
	// 'AUTONUMBER'
	// 'RECORD_ID'
	// 'USER'
	switch (field.type) {
		case 'NUMBER':
			return 'number';
		// case 'LINKED_RECORD':	// TODO-Darek: what do with linked record?
		// 	return 'XXX'
		case 'SELECT':
			return 'options';		// TODO-Darek: add options to choose from (!)
		// case 'PERCENT':	// TODO-Darek: what here?
		// 	return 'XXX'
		// case 'DURATION':		// TODO-Darek: what here?
		// 	return 'XXX'
		// case 'RATING':
		// 	return 'XXX'
		// case 'PROGRESS':
		// 	return 'XXX'
		case 'DATETIME':
			return 'dateTime';
		// case 'BUTTON':	// TODO-Darek: ??
		// 	return 'XXX'
		case 'CHECKBOX':
			return 'boolean';
		case 'URL':
			return 'url';
		// case 'ATTACHMENT':	// TODO-Darek: ??
		// 	return 'XXX'
		case 'TIME':
			return 'time'
		// case 'DATE_RANGE':	// TODO-Darek: ??
		// 	return 'XXX'
		// case 'LOOKUP':	// TODO-Darek: ??
		// 	return 'XXX'
		// case 'ROLLUP': // TODO-Darek: ??
		// 	return 'XXX'
		// case 'FORMULA': // TODO-Darek: ??
		// 	return 'XXX'
		// case 'COUNT': // TODO-Darek: ??
		// 	return 'XXX'
		case 'CREATED_AT':
			return 'dateTime';
		case 'UPDATED_AT':
			return 'dateTime'
		case 'AUTONUMBER':
			return 'number'
		case 'RECORD_ID':
			return 'number'
		default:
			return 'string';
	}
}
