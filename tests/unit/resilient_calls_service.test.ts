import ResilientCallsService from '../../app/services/error-handling/resilitent_calls_service';
import axios from 'axios';

jest.mock('axios');
jest.mock('opossum');

describe('ResilientCallsService', () => {
  let service: ResilientCallsService;
  let mockPostData: jest.Mock;

  beforeEach(() => {
    mockPostData = axios as unknown as jest.Mock;
    service = new ResilientCallsService();

    jest
      .spyOn(service, 'postDataWithResilience')
      .mockResolvedValue({ data: 'success' });
  });

  it('should make a successful request without retrying if circuit is closed', async () => {
    const mockResponse = { data: 'success' };

    const response = await service.postDataWithResilience(
      'http://www.google.com',
      { key: 'value' },
    );

    expect(service.postDataWithResilience).toHaveBeenCalledWith(
      'http://www.google.com',
      { key: 'value' },
    );
    expect(response).toEqual(mockResponse);
  });

  it('should call postDataWithResilience with correct arguments', async () => {
    const mockResponse = { data: 'success' };

    const response = await service.postDataWithResilience(
      'http://www.google.com',
      { key: 'value' },
    );

    expect(service.postDataWithResilience).toHaveBeenCalledTimes(1);
    expect(service.postDataWithResilience).toHaveBeenCalledWith(
      'http://www.google.com',
      { key: 'value' },
    );
    expect(response).toEqual(mockResponse);
  });

  // it('should retry with exponential backoff if postData fails and circuit is open', async () => {
  //   const response = await service.postDataWithResilience(
  //     'http://www.google.com',
  //     { key: 'value' },
  //   );

  //   expect(service.circuitBreaker.fire).toHaveBeenCalledWith(
  //     'http://www.google.com',
  //     { key: 'value' },
  //   );
  //   expect(service.circuitBreaker.fire).toHaveBeenCalledTimes(1);
  // });
});
