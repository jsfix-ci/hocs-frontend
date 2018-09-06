import { getDocument, apiGetDocumentList, getDocumentList } from '../document.js';

const mockCaseworkSeviceClient = jest.fn();
const mockStream = jest.fn();
jest.mock('../../libs/request.js', () => {
    return {
        caseworkServiceClient: {
            get: (url, options) => {
                mockCaseworkSeviceClient(url);
                if (url === '/case/TEST_CASE_ID/document') {
                    if (options && options.responseType === 'stream') {
                        return Promise.resolve({
                            data: {
                                pipe: mockStream
                            }
                        });
                    } else {
                        return Promise.resolve({
                            data: 'MOCK_DOCUMENT_LIST'
                        });
                    }
                } else {
                    return Promise.reject(new Error('MOCK_ERROR'));
                }
            }
        }
    };
});
const mockCreateReadStream = jest.fn();
const mockPipe = jest.fn();
const mockGetObject = jest.fn();
jest.mock('../../libs/aws.js', () => ({
    s3: {
        getObject: (options) => {
            mockGetObject(options);
            return {
                createReadStream: () => {
                    mockCreateReadStream();
                    return {
                        pipe: mockPipe
                    };
                }
            };
        }
    }
}));

describe('Document middleware', () => {

    const send = jest.fn();
    const status = jest.fn(() => ({
        send: send
    }));
    const next = jest.fn();
    let req, res;

    beforeEach(() => {
        next.mockReset();
        status.mockReset();
        send.mockReset();
        req = {};
        res = { status, locals: {} };
    });

    it('should call the caseworkServiceClient and attach workstack data to the response object', async () => {
        req = { params: { caseId: 'TEST_CASE_ID' } };
        await getDocumentList(req, res, next);
        expect(mockCaseworkSeviceClient).toHaveBeenCalled();
        expect(mockCaseworkSeviceClient).toHaveBeenLastCalledWith(`/case/${req.params.caseId}/document`);
        expect(next).toHaveBeenCalled();
        expect(res.locals).toBeDefined();
        expect(res.locals.documents).toBeDefined();
        expect(res.locals.documents).toEqual('MOCK_DOCUMENT_LIST');
    });

    it('should return a 404 and error if the request fails', () => {
        req = { params: { caseId: 'INVALID_CASE_ID' } };
        getDocumentList(req, res)
            .then(() => { })
            .catch(e => {
                expect(e).toBeDefined();
                expect(e).toBeInstanceOf(Error);
            });
    });

});

describe('Document API response middleware', () => {

    const send = jest.fn();
    const status = jest.fn(() => ({
        send
    }));
    let req, res;

    beforeEach(() => {
        req = {};
        res = { status };
        send.mockReset();
        mockStream.mockReset();
    });

    it('should return the workstack object from the response object', async () => {
        req = { params: { caseId: 'TEST_CASE_ID' } };
        await apiGetDocumentList(req, res);
        expect(mockCaseworkSeviceClient).toHaveBeenLastCalledWith(`/case/${req.params.caseId}/document`);
        expect(status).not.toHaveBeenCalled();
        expect(send).not.toHaveBeenCalled();
        expect(mockStream).toHaveBeenCalled();
        expect(mockStream).toHaveBeenCalledWith(res);
    });

    it('should return a 404 and error if the request fails', () => {
        req = { params: { caseId: 'INVALID_CASE_ID' } };
        apiGetDocumentList(req, res)
            .then(() => { })
            .catch(e => {
                expect(e).toBeDefined();
                expect(e).toBeInstanceOf(Error);
            });
    });
});

describe('Get document', () => {

    let req = { params: { documentId: 'MOCK_DOCUMENT_ID' } };
    let res = { setHeader: jest.fn() };

    beforeEach(() => {
        mockGetObject.mockReset();
        mockCreateReadStream.mockReset();
        mockStream.mockReset();
        mockPipe.mockReset();
    });

    it('should return the document from s3', () => {
        getDocument(req, res);
        expect(mockGetObject).toHaveBeenCalled();
        expect(mockGetObject.mock.calls[0][0].Key).toEqual(req.params.documentId);
        expect(mockCreateReadStream).toHaveBeenCalled();
        expect(mockPipe).toHaveBeenCalled();
        expect(mockPipe).toHaveBeenCalledWith(res);
    });
});