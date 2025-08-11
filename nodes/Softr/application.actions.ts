import { IExecuteFunctions, IHttpRequestOptions, NodeApiError } from 'n8n-workflow';

const SOFTR_STUDIO_USERS = 'https://studio-api.softr.io/v1/api/users';

export async function createAppUser(this: IExecuteFunctions, index: number): Promise<any> {
	const domain = getDomain.call(this, index);
	const payload: IHttpRequestOptions = {
		method: 'POST',
		url: `${SOFTR_STUDIO_USERS}`,
		headers: {
			'Content-Type': 'application/json',
			'Softr-Domain': domain,
		},
		body: {
			full_name: this.getNodeParameter('fullName', index) as string,
			email: this.getNodeParameter('email', index) as string,
			password: this.getNodeParameter('initialPassword', index) as string,
			generate_magic_link: this.getNodeParameter('magicLink', index) as boolean,
		},
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'softrApi', payload);
}

export async function deleteAppUser(this: IExecuteFunctions, index: number): Promise<any> {
	const successResponse = { deleted: true };
	const email = this.getNodeParameter('email', index) as string;
	const domain = getDomain.call(this, index);
	let payload: IHttpRequestOptions = {
		method: 'DELETE',
		url: `${SOFTR_STUDIO_USERS}/${email}`,
		headers: { 'Softr-Domain': domain },
	};
	try {
		await this.helpers.httpRequestWithAuthentication.call(this, 'softrApi', payload);
	} catch (error: any) {
		const statusCode = error?.httpCode || error?.statusCode || error?.response?.statusCode;
		if (Number(statusCode) === 404) {
			// Idempotent success
			return successResponse;
		}
		throw new NodeApiError(this.getNode(), error);
	}
	return successResponse;
}

function getDomain(this: IExecuteFunctions, index: number) {
	return this.getNodeParameter('domain', index) as string;
}
