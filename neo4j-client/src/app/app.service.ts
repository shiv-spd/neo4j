import { Injectable } from '@angular/core';
import { URLSearchParams, Http, Response, RequestOptions, Headers } from '@angular/http';
import {Observable} from 'rxjs';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';

const ENDPOINT = 'http://localhost:3000';
/**
* Custom error object
*/
function HttpError(message, data) {
  this.name = 'HttpError';
  this.data = data || {};
  this.message = message || 'Default Message';
  this.stack = (new Error()).stack;
  this.json = function() {
    return this.data.json();
  }
}
HttpError.prototype = Object.create(Error.prototype);
HttpError.prototype.constructor = HttpError;


@Injectable()
export class AppService {

 constructor (private _http: Http) {}
   
  getNodeTypes() {
    const url = `${ENDPOINT}/nodetypes`;
    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
    
  getUsers() {
    const url = `${ENDPOINT}/users`;
    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
  
  getResultsForNodeType(nodeType) {
    const url = `${ENDPOINT}/${nodeType}`;
    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
    
  getComments() {
    const url = `${ENDPOINT}/comments`;
    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
    
  getPosts() {
    const url = `${ENDPOINT}/posts`;
    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
    
  createUser({data}) {
    let url: any = `${ENDPOINT}/user`;
      
    let headers = new Headers({
      'Content-Type': 'application/json'
    });

    let options = new RequestOptions({ headers: headers });
    return this._http.post(url, JSON.stringify(data), options).map(this.extractData).catch(this.handleError);
  }
    
  createPost({data}) {
    let url: any = `${ENDPOINT}/post`;

    let headers = new Headers({
      'Content-Type': 'application/json'
    });

    let options = new RequestOptions({ headers: headers });
    return this._http.post(url, JSON.stringify(data), options).map(this.extractData).catch(this.handleError);
  }
    
  createComment({data}) {
    let url: any = `${ENDPOINT}/comment`;

    let headers = new Headers({
      'Content-Type': 'application/json'
    });

    let options = new RequestOptions({ headers: headers });
    return this._http.post(url, JSON.stringify(data), options).map(this.extractData).catch(this.handleError);
  }
  
  getConnectedNodesRelationships({node, level, nodeType}) {
    var id = node.properties.id || node._id;
    let url: any = `${ENDPOINT}/connectednodesrelationships/id/${id}/nodeType/${nodeType}/level/${level}`;

    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }
    
  getConnectedNodes({node, level, rel, nodeType}) {
    var id = node.properties.id || node._id;
    let url: any = `${ENDPOINT}/connectednodes/id/${id}/nodeType/${nodeType}/relation/${rel}/level/${level}`;

    return this._http.get(url).map(this.extractData).catch(this.handleError);
  }

  private extractData(res: Response) {
    if (res.status < 200 || res.status >= 300) {
      throw new HttpError('Bad response status: ' + res.status, res);
    }

    let body;
    try {
      body = res.json();
    } catch (error) {
      body = null;
    }

    return body || [];
  }

  //handle generic error
  private handleError(error: any) {

    let errorBody;
    try {
      errorBody = error.json();
    } catch (error) {
      errorBody = new Error('Error in getting http response');
    }

    return Observable.throw(errorBody);
  }

}
