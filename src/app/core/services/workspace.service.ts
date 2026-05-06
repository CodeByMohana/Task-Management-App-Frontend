import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Workspace, CreateWorkspaceRequest, UpdateWorkspaceRequest,
  WorkspaceMember, AddMemberRequest
} from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly base = `${environment.apiUrl}/api/workspaces`;

  constructor(private http: HttpClient) {}

  getMyWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/my`, { withCredentials: true });
  }

  getWorkspace(id: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/${id}`, { withCredentials: true });
  }

  getPublicWorkspaces(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.base}/public`, { withCredentials: true });
  }

  createWorkspace(req: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<Workspace>(this.base, req, { withCredentials: true });
  }

  updateWorkspace(id: number, req: UpdateWorkspaceRequest): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/${id}`, req, { withCredentials: true });
  }

  deleteWorkspace(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`, { withCredentials: true });
  }

  getMembers(workspaceId: number): Observable<WorkspaceMember[]> {
    return this.http.get<WorkspaceMember[]>(`${this.base}/${workspaceId}/members`, { withCredentials: true });
  }

  addMember(workspaceId: number, req: AddMemberRequest): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.base}/${workspaceId}/members`, req, { withCredentials: true });
  }

  removeMember(workspaceId: number, targetUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${workspaceId}/members/${targetUserId}`, { withCredentials: true });
  }

  updateMemberRole(workspaceId: number, targetUserId: number, role: string): Observable<WorkspaceMember> {
    return this.http.patch<WorkspaceMember>(
      `${this.base}/${workspaceId}/members/${targetUserId}/role`,
      null,
      { params: { role }, withCredentials: true }
    );
  }
}
