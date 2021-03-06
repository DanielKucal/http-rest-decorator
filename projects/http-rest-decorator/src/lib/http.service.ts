import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient, HttpEventType, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ResponseArgAdapter } from './http.decorator';
import { catchError, filter, mergeMap } from 'rxjs/operators';
import { HttpAdapter } from './http.adapter';
import { HttpConfig } from './http.config';
import { HTTP_CONFIG } from './http.module';

/**
 * data type transmitted over http protocol
 */
export enum MediaType {
  json = 'JSON',
  formData = 'FORM_DATA'
}

/**
 * header type for http request
 */
export type HttpHeaderType = string | { [name: string]: string | string[] };


/**
 * http communication service
 */
@Injectable({
  providedIn: 'root'
})
export class HttpService {

  /**
   * constructor
   * @param http http service for data exchange via http protocol
   */
  constructor(
    public http: HttpClient,
    @Optional() @Inject(HTTP_CONFIG) private config: HttpConfig
  ) {
  }

  /**
   * returns the url address of webApi
   */
  protected getBaseUrl(): string {
    return this.config !== null ? this.config.Url : null;
  }

  /**
   * returns the default http request header
   */
  protected getDefaultHeaders(): HttpHeaderType {
    return this.config !== null
      ? this.config.Headers
      :
      {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'DataType': 'application/json'
      };
  }

  /**
   * responses interceptor
   * @param request request sent to the server
   * @param adapterFn call function to prepare request data
   * @param exceptionAdapterFn exception handler
   */
  protected requestInterceptor(request: HttpRequest<any>, adapterFn?: Function[], exceptionAdapterFn?: Function): HttpRequest<any> {
    return HttpAdapter.baseRequestAdapter(request, adapterFn, exceptionAdapterFn);
  }

  /**
   * responses interceptor
   * @param response$ response received from the server
   * @param adapters call function metadata to prepare response data
   * @param exceptionAdapterFn exception handler
   */
  protected responseInterceptor<T>(response$: Observable<any>, adapters?: ResponseArgAdapter[], exceptionAdapterFn?: Function)
    : Observable<T> {
    return response$
      .pipe(
        filter(event => {
          return event.type === HttpEventType.Response;
        }),
        catchError(err => {
          if (exceptionAdapterFn) {
            return throwError(exceptionAdapterFn(err));
          }
          return throwError(err);
        }),
        mergeMap(res => HttpAdapter.baseResponseAdapter(res, adapters, this, exceptionAdapterFn))
      );
  }

  /**
   * mockup data generation
   * @param request request sent to the server
   * @param fn call function to
   * @param args the arguments of the called data generation function
   */
  protected mockupInterceptor(request: HttpRequest<any>, fn: Function, args: { time: number })
    : Observable<HttpResponse<any>> {
    if (fn) {

      return new Observable<HttpResponse<any>>(obs => {

        let data: any;
        try {
          data = fn.call(this, request);
        } catch (err) {
          obs.error(err);
          return;
        }

        const response = new HttpResponse({
          headers: request.headers,
          body: data,
          status: 200
        });

        if (args.time) {
          setTimeout(() => {
            obs.next(response);
            obs.complete();
          }, args.time);
        } else {
          obs.next(response);
          obs.complete();
        }
      });
    }
  }

  /**
   * request interceptor (for request sync)
   * @param body request data sent to the server
   * @param url URL
   * @param args query parameter
   * @param adapterFn call function to prepare request data
   * @param exceptionAdapterFn exception handler
   */
  protected requestInterceptorSync(body: string, url: string, args: string, adapterFn?: Function[], exceptionAdapterFn?: Function): string {
    return HttpAdapter.baseRequestAdapterSync(body, url, args, adapterFn, exceptionAdapterFn);
  }

  /**
   * responses interceptor (for request sync)
   * @param body response received from the server
   * @param adapterFn call function to prepare response data
   * @param exceptionAdapterFn exception handler
   */
  protected responseInterceptorSync(body: any, adapterFn?: Function, exceptionAdapterFn?: Function): any {
    return HttpAdapter.baseResponseAdapterSync(body, adapterFn, this, exceptionAdapterFn);
  }
}
