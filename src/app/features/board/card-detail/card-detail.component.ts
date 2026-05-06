import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardService } from '../../../core/services/card.service';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { LabelService } from '../../../core/services/label.service';
import { Card, UpdateCardRequest, CardPriority, CardStatus, CardAttachment } from '../../../core/models/card.model';
import { Comment, AddCommentRequest } from '../../../core/models/comment.model';
import { BoardList } from '../../../core/models/board.model';
import { User } from '../../../core/models/user.model';
import { WorkspaceMember } from '../../../core/models/workspace.model';
import { Label, Checklist, ChecklistItem } from '../../../core/models/label.model';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="card-modal" (click)="$event.stopPropagation()">

        <!-- Cover -->
        @if (card.coverColor) {
          <div class="card-cover" [style.background]="card.coverColor"></div>
        }

        <div class="modal-layout">
          <!-- Left: Main Content -->
          <div class="modal-main">
            <button class="close-btn" (click)="close()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>

            <!-- Title -->
            @if (editingTitle() && !noEdit()) {
              <textarea class="title-input" [(ngModel)]="titleVal" (blur)="saveTitle()"
                (keyup.enter)="saveTitle()" (keyup.escape)="editingTitle.set(false)" autofocus></textarea>
            } @else {
              <h2 class="card-title" (click)="!noEdit() && startEditTitle()">{{ card.title }}</h2>
            }

            @if (boardClosed) {
              <div class="closed-notice"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> This board is closed. No changes can be made.</div>
            } @else if (readOnly) {
              <div class="closed-notice"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> View-only — only board admins can edit card details.</div>
            }

            <div class="card-meta-row">
              <span class="meta-chip">in <strong>{{ listName() }}</strong></span>
            </div>

            <!-- Description -->
            <div class="section">
              <div class="section-label">Description</div>
              @if (editingDesc() && !noEdit()) {
                <textarea class="desc-input" [(ngModel)]="descVal" rows="4"
                  placeholder="Add a description..." (blur)="saveDesc()" autofocus></textarea>
                <div class="inline-actions">
                  <button class="btn-sm-primary" (click)="saveDesc()">Save</button>
                  <button class="btn-sm" (click)="editingDesc.set(false)">Cancel</button>
                </div>
              } @else {
                <div class="desc-view" (click)="!noEdit() && startEditDesc()">
                  {{ card.description || (noEdit() ? 'No description' : 'Click to add a description...') }}
                </div>
              }
            </div>

            <!-- Card Labels -->
            @if (cardLabels().length > 0) {
              <div class="section">
                <div class="section-label">Labels</div>
                <div class="label-chips">
                  @for (lbl of cardLabels(); track lbl.labelId) {
                    <span class="label-chip" [style.background]="lbl.color" [style.color]="getContrastColor(lbl.color)">
                      {{ lbl.name }}
                      @if (!noEdit()) {
                        <button class="label-remove" (click)="removeLabelFromCard(lbl)">×</button>
                      }
                    </span>
                  }
                </div>
              </div>
            }

            <!-- Checklists -->
            @for (cl of checklists(); track cl.checklistId) {
              <div class="section checklist-section">
                <div class="section-label">
                  <span>☑ {{ cl.title }}</span>
                  @if (!noEdit()) {
                    <button class="btn-icon-sm" (click)="deleteChecklist(cl)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  }
                </div>
                <!-- Progress bar -->
                <div class="cl-progress-row">
                  <span class="cl-progress-text">{{ cl.completedCount }}/{{ cl.totalCount }}</span>
                  <div class="cl-progress-bar">
                    <div class="cl-progress-fill" [style.width.%]="cl.progressPercent"
                      [class.complete]="cl.progressPercent === 100"></div>
                  </div>
                  <span class="cl-progress-pct">{{ cl.progressPercent }}%</span>
                </div>
                <!-- Items -->
                @for (item of cl.items; track item.itemId) {
                  <label class="cl-item" [class.done]="item.completed">
                    <input type="checkbox" [checked]="item.completed" (change)="toggleChecklistItem(item)" [disabled]="noEdit()" />
                    <span class="cl-item-text">{{ item.text }}</span>
                    @if (!noEdit()) {
                      <button class="cl-item-delete" (click)="deleteChecklistItem(cl, item)">×</button>
                    }
                  </label>
                }
                <!-- Add item -->
                @if (!noEdit()) {
                  @if (addingItemToChecklist() === cl.checklistId) {
                    <div class="cl-add-form">
                      <input [(ngModel)]="newItemText" placeholder="Add an item..." (keyup.enter)="addChecklistItem(cl)" />
                      <div class="inline-actions">
                        <button class="btn-sm-primary" (click)="addChecklistItem(cl)">Add</button>
                        <button class="btn-sm" (click)="addingItemToChecklist.set(null)">Cancel</button>
                      </div>
                    </div>
                  } @else {
                    <button class="cl-add-btn" (click)="addingItemToChecklist.set(cl.checklistId)">+ Add an item</button>
                  }
                }
              </div>
            }

            <!-- Comments -->
            <div class="section">
              <div class="section-label">Comments</div>
              <div class="comment-input-row">
                <div class="avatar-sm">{{ currentUserInitial() }}</div>
                <div class="comment-compose">
                  <textarea [(ngModel)]="newComment" placeholder="Write a comment..." rows="2" [disabled]="!canComment()"></textarea>
                  <button class="btn-sm-primary" [disabled]="!newComment.trim() || !canComment()" (click)="postComment()">Post</button>
                </div>
              </div>
              <div class="comments-list">
                @for (c of comments(); track c.commentId) {
                  <div class="comment-item">
                    <div class="avatar-sm">{{ getUserInitial(c.authorUserId) }}</div>
                    <div class="comment-body">
                      <div class="comment-header">
                        <strong>{{ getUserName(c.authorUserId) }}</strong>
                        <span class="comment-time">{{ c.createdAt | date:'MMM d, h:mm a' }}</span>
                      </div>
                      @if (c.deleted) {
                        <p class="deleted-comment">[deleted]</p>
                      } @else if (editingCommentId() === c.commentId) {
                        <textarea [(ngModel)]="editingCommentText" rows="2"></textarea>
                        <div class="inline-actions">
                          <button class="btn-sm-primary" (click)="saveComment(c)">Save</button>
                          <button class="btn-sm" (click)="editingCommentId.set(null)">Cancel</button>
                        </div>
                      } @else {
                        <p>{{ c.content }}</p>
                        <div class="comment-actions">
                          @if (canComment()) {
                            <button (click)="startEditComment(c)">Edit</button>
                            <button (click)="deleteComment(c)" class="danger-link">Delete</button>
                            <button (click)="replyTo.set(c.commentId)">Reply</button>
                          }
                        </div>
                        @if (replyTo() === c.commentId) {
                          <div class="reply-form">
                            <textarea [(ngModel)]="replyText" placeholder="Write a reply..." rows="2"></textarea>
                            <button class="btn-sm-primary" (click)="postReply(c)">Reply</button>
                            <button class="btn-sm" (click)="replyTo.set(null)">Cancel</button>
                          </div>
                        }
                        @for (reply of c.replies; track reply.commentId) {
                          <div class="reply-item">
                            <div class="avatar-sm sm">{{ getUserInitial(reply.authorUserId) }}</div>
                            <div class="comment-body">
                              <strong>{{ getUserName(reply.authorUserId) }}</strong>
                              <p>{{ reply.content }}</p>
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
                @if (comments().length === 0) {
                  <p class="no-comments">No comments yet. Be the first!</p>
                }
              </div>
            </div>
          </div>

          <!-- Right: Sidebar -->
          <div class="modal-sidebar">
            <div class="sidebar-section">
              <div class="sidebar-label">Assignee</div>
              <select [(ngModel)]="assigneeVal" (change)="updateField()" [disabled]="noEdit()">
                <option [ngValue]="null">Unassigned</option>
                @for (m of workspaceMembers(); track m.userId) {
                  <option [ngValue]="m.userId">{{ getUserName(m.userId) }}</option>
                }
              </select>
            </div>

            <div class="sidebar-section">
              <div class="sidebar-label">Status</div>
              <select [(ngModel)]="statusVal" (change)="updateField()" [disabled]="!canEditStatus()">
                <option value="TO_DO">Todo</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div class="sidebar-section">
              <div class="sidebar-label">Priority</div>
              <select [(ngModel)]="priorityVal" (change)="updateField()" [disabled]="noEdit()">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div class="sidebar-section">
              <div class="sidebar-label">Due Date</div>
              <input type="date" [(ngModel)]="dueDateVal" (change)="updateField()" [disabled]="noEdit()" />
            </div>

            @if (!noEdit()) {
              <div class="sidebar-section">
                <div class="sidebar-label">Move to List</div>
                <select [(ngModel)]="moveListVal" (change)="moveCard()">
                  @for (l of lists; track l.listId) {
                    <option [value]="l.listId">{{ l.name }}</option>
                  }
                </select>
              </div>
            }

            @if (!noEdit()) {
              <div class="sidebar-section">
                <div class="sidebar-label">Cover Color</div>
                <div class="color-row">
                  @for (c of coverColors; track c) {
                    <button class="color-dot" [style.background]="c"
                      [class.active]="coverVal === c" (click)="setCover(c)"></button>
                  }
                  <button class="color-dot none-dot" [class.active]="!coverVal" (click)="setCover('')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            }

            <!-- Labels Picker -->
            @if (!noEdit()) {
              <div class="sidebar-section">
                <div class="sidebar-label">Labels</div>
                <div class="label-picker">
                  @if (showLabelPicker()) {
                    <div class="label-dropdown">
                      <div class="label-dropdown-header">
                        <h4>Labels</h4>
                        <button class="close-btn-sm" (click)="showLabelPicker.set(false)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                      </div>
                      
                      <div class="label-list">
                        @for (lbl of boardLabels(); track lbl.labelId) {
                          <button class="label-option" (click)="toggleLabelOnCard(lbl)" [class.selected]="isLabelOnCard(lbl)">
                            <span class="label-dot" [style.background]="lbl.color"></span>
                            <span class="label-option-name">{{ lbl.name }}</span>
                            @if (isLabelOnCard(lbl)) { <span class="label-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"></polyline></svg></span> }
                          </button>
                        }
                        @if (boardLabels().length === 0) {
                          <p class="sidebar-hint" style="padding:12px; text-align:center;">No labels yet.</p>
                        }
                      </div>
                      
                      <!-- Create new label -->
                      <div class="label-create-section">
                        <h5>Create Label</h5>
                        <input [(ngModel)]="newLabelName" placeholder="Label name..." class="label-create-input" />
                        
                        <div class="label-color-grid">
                          @for (c of coverColors; track c) {
                            <button class="label-color-btn" [style.background]="c"
                              [class.active]="newLabelColor === c" (click)="newLabelColor = c"></button>
                          }
                        </div>
                        
                        <button class="btn-sm-primary btn-full" [disabled]="!newLabelName.trim()" (click)="createLabel()">Create</button>
                      </div>
                    </div>
                  }
                  <button class="btn-sm" style="width:100%;" (click)="showLabelPicker.set(!showLabelPicker())">
                    {{ showLabelPicker() ? 'Close' : 'Manage Labels' }}
                  </button>
                </div>
              </div>
            }

            <!-- Add Checklist -->
            @if (!noEdit()) {
              <div class="sidebar-section">
                <div class="sidebar-label">Checklist</div>
                @if (addingChecklist()) {
                  <input [(ngModel)]="newChecklistTitle" placeholder="Checklist title..." class="checklist-title-input"
                    (keyup.enter)="createChecklist()" autofocus />
                  <div class="inline-actions" style="margin-top:8px;">
                    <button class="btn-sm-primary" (click)="createChecklist()" [disabled]="!newChecklistTitle.trim()">Add</button>
                    <button class="btn-sm" (click)="addingChecklist.set(false)">Cancel</button>
                  </div>
                } @else {
                  <button class="btn-sm" style="width:100%;" (click)="addingChecklist.set(true)">+ Add Checklist</button>
                }
              </div>
            }

            <div class="sidebar-section">
              <div class="sidebar-label">Attachments</div>
              @if (canUpload()) {
                <div class="file-upload-zone"
                  (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)"
                  (drop)="onFileDrop($event)" [class.drag-active]="fileDragActive()"
                  (click)="fileInput.click()">
                  <input #fileInput type="file" hidden (change)="onFileSelected($event)" multiple />
                  <span class="upload-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></span>
                  <span class="upload-text">Drop files or click to upload</span>
                </div>
              }
              @if (uploading()) {
                <div class="upload-progress">
                  <div class="upload-bar"><div class="upload-fill"></div></div>
                  <span>Uploading...</span>
                </div>
              }
              @if (attachments().length > 0) {
                @for (att of attachments(); track att.attachmentId) {
                  <div class="att-item">
                    <span class="att-icon">
                      @if (att.fileType.startsWith('image/')) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      } @else if (att.fileType.includes('pdf')) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      } @else if (att.fileType.includes('zip') || att.fileType.includes('rar')) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                      } @else if (att.fileType.includes('video')) {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                      } @else {
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                      }
                    </span>
                    <a href="javascript:void(0)" (click)="downloadAttachment(att)" class="att-name">{{ att.fileName }}</a>
                    <span class="att-size">{{ formatSize(att.fileSize) }}</span>
                    @if (canUpload()) {
                      <button class="att-delete" (click)="deleteAttachment(att)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    }
                  </div>
                }
              } @else {
                <p class="sidebar-hint">No attachments yet</p>
              }
            </div>

            @if (!noEdit()) {
              <div class="danger-zone">
                <button class="btn-danger" (click)="archiveCard()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: middle; margin-right: 4px; margin-top: -2px;"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg> Archive Card
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-start; justify-content: center; z-index: 500; backdrop-filter: blur(6px); padding: 40px 20px; overflow-y: auto; opacity: 0; animation: fadeIn 0.2s forwards; }
    @keyframes fadeIn { to { opacity: 1; } }
    .card-modal { background: var(--card-bg); border-radius: 16px; width: 100%; max-width: 880px; overflow: hidden; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); transform: scale(0.98); animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; border: 1px solid var(--border); }
    @keyframes popIn { to { transform: scale(1); } }
    .card-cover { height: 120px; opacity: 0.85; }
    .modal-layout { display: flex; min-height: 550px; }
    .modal-main { flex: 1; padding: 32px; min-width: 0; position: relative; }
    .modal-sidebar { width: 260px; flex-shrink: 0; background: var(--list-bg); border-left: 1px solid var(--border); padding: 32px 24px; }
    .close-btn { position: absolute; top: 20px; right: 20px; background: var(--hover); border: none; cursor: pointer; font-size: 16px; color: var(--text-muted); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; z-index: 10; }
    .close-btn:hover { background: var(--border); color: var(--text); transform: rotate(90deg); }

    .card-title { font-size: 24px; font-weight: 700; margin: 0 50px 12px 0; cursor: text; line-height: 1.3; color: var(--text); letter-spacing: -0.02em; }
    .card-title:hover { background: var(--hover); border-radius: var(--radius-md); padding: 4px 8px; margin: -4px 42px 8px -8px; }
    .title-input { font-size: 24px; font-weight: 700; width: 100%; border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 8px 12px; margin: -10px 0 2px -14px; resize: none; background: var(--card-bg); color: var(--text); font-family: inherit; box-sizing: border-box; box-shadow: var(--shadow-sm); outline: none; letter-spacing: -0.02em; }
    .card-meta-row { margin-bottom: 32px; }
    .meta-chip { font-size: 13px; color: var(--text-muted); background: var(--hover); padding: 6px 12px; border-radius: 20px; font-weight: 500; }
    .meta-chip strong { color: var(--text); text-decoration: underline; text-decoration-color: var(--border); text-underline-offset: 4px; }

    .section { margin-bottom: 32px; }
    .section-label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .desc-view { font-size: 15px; color: var(--text); background: var(--hover); border-radius: var(--radius-md); padding: 16px; cursor: text; min-height: 80px; line-height: 1.6; border: 1px solid transparent; transition: all 0.2s; }
    .desc-view:hover { background: var(--hover); border-color: var(--border); }
    .desc-input { width: 100%; border: 2px solid var(--accent); border-radius: var(--radius-md); padding: 16px; font-size: 15px; color: var(--text); background: var(--card-bg); resize: vertical; font-family: inherit; box-sizing: border-box; outline: none; box-shadow: var(--shadow-sm); line-height: 1.6; }
    .inline-actions { display: flex; gap: 10px; margin-top: 10px; }
    .btn-sm-primary { padding: 8px 16px; background: var(--accent); color: #fff; border: none; border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
    .btn-sm-primary:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .btn-sm-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-sm { padding: 8px 16px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; cursor: pointer; color: var(--text); font-weight: 500; transition: all 0.2s; }
    .btn-sm:hover { background: var(--hover); }

    /* Comments */
    .comment-input-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .comment-compose { flex: 1; }
    .comment-compose textarea { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 16px; font-size: 14px; color: var(--text); background: var(--card-bg); resize: none; font-family: inherit; box-sizing: border-box; transition: all 0.2s; outline: none; box-shadow: var(--shadow-sm); }
    .comment-compose textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-muted); }
    .comment-compose button { margin-top: 10px; }
    .comments-list { display: flex; flex-direction: column; gap: 24px; }
    .comment-item { display: flex; gap: 16px; }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0; box-shadow: var(--shadow-sm); }
    .avatar-sm.sm { width: 28px; height: 28px; font-size: 11px; }
    .comment-body { flex: 1; background: var(--hover); padding: 16px; border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg); border: 1px solid var(--border); }
    .comment-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .comment-header strong { font-size: 14px; color: var(--text); }
    .comment-time { font-size: 12px; color: var(--text-muted); }
    .comment-body p { margin: 0 0 10px; font-size: 14px; line-height: 1.6; color: var(--text); }
    .comment-body textarea { width: 100%; border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none; margin-bottom: 8px; }
    .comment-actions { display: flex; gap: 12px; }
    .comment-actions button { background: none; border: none; cursor: pointer; font-size: 13px; color: var(--text-muted); padding: 0; font-weight: 500; transition: color 0.2s; }
    .comment-actions button:hover { color: var(--text); }
    .danger-link { color: #ef4444 !important; }
    .danger-link:hover { color: #b91c1c !important; }
    .deleted-comment { color: var(--text-muted); font-style: italic; margin: 0; }
    .reply-form { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
    .reply-form textarea { width: 100%; border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; font-family: inherit; box-sizing: border-box; outline: none; }
    .reply-item { display: flex; gap: 12px; margin-top: 16px; padding-left: 16px; border-left: 2px solid var(--border); }
    .reply-item .comment-body { padding: 12px; border-radius: var(--radius-md); background: var(--card-bg); }
    .no-comments { color: var(--text-muted); font-size: 14px; font-style: italic; text-align: center; padding: 24px; background: var(--hover); border-radius: var(--radius-md); border: 1px dashed var(--border); }

    /* Sidebar */
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 10px; }
    select, input[type=date] { width: 100%; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; font-size: 14px; color: var(--text); background: var(--card-bg); box-sizing: border-box; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); font-weight: 500; }
    select:hover, input[type=date]:hover { border-color: var(--text-muted); }
    select:focus, input[type=date]:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-muted); }
    
    .color-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .color-dot { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .color-dot:hover { transform: scale(1.15); box-shadow: var(--shadow-sm); }
    .color-dot.active { border-color: var(--text); box-shadow: 0 0 0 2px var(--card-bg) inset; }
    .none-dot { background: var(--hover); border: 1px solid var(--border); font-size: 14px; display: flex; align-items: center; justify-content: center; }
    
    .att-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-md); background: var(--card-bg); border: 1px solid var(--border); margin-bottom: 8px; transition: all 0.2s; }
    .att-item:hover { border-color: var(--text-muted); box-shadow: var(--shadow-sm); }
    .att-icon { font-size: 18px; flex-shrink: 0; }
    .att-name { font-size: 13px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); text-decoration: none; }
    .att-name:hover { color: var(--accent); }
    .att-size { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
    .att-delete { background: var(--hover); border: none; cursor: pointer; color: var(--text-muted); font-size: 12px; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
    .att-delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .sidebar-hint { font-size: 13px; color: var(--text-muted); font-style: italic; margin: 4px 0 0; }

    /* File Upload */
    .file-upload-zone {
      border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 20px 16px;
      text-align: center; cursor: pointer; transition: all 0.2s; margin-bottom: 16px;
      display: flex; flex-direction: column; align-items: center; gap: 8px; background: var(--card-bg);
    }
    .file-upload-zone:hover { border-color: var(--accent); background: var(--accent-muted); }
    .file-upload-zone.drag-active { border-color: var(--accent); background: var(--accent-muted); transform: scale(1.02); }
    .upload-icon { font-size: 28px; }
    .upload-text { font-size: 13px; font-weight: 500; color: var(--text-muted); }
    
    .upload-progress { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; background: var(--card-bg); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border); }
    .upload-progress span { font-size: 12px; font-weight: 500; color: var(--text-muted); }
    .upload-bar { flex: 1; height: 6px; background: var(--hover); border-radius: 3px; overflow: hidden; }
    .upload-fill { width: 60%; height: 100%; background: var(--accent); border-radius: 3px; animation: uploadAnim 1.2s ease-in-out infinite; }
    @keyframes uploadAnim { 0%,100%{width:20%; transform:translateX(0)} 50%{width:60%; transform:translateX(50px)} }

    .danger-zone { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
    .btn-danger { width: 100%; padding: 10px; background: #fff; color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); }
    .btn-danger:hover { background: rgba(239,68,68,0.05); border-color: #ef4444; }
    :host-context(.dark) .btn-danger { background: var(--card-bg); }

    .closed-notice { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: #d97706; padding: 12px 16px; border-radius: var(--radius-md); font-size: 13px; font-weight: 500; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    select:disabled, input:disabled, textarea:disabled { opacity: 0.6; cursor: not-allowed; background: var(--hover); }

    /* Labels */
    .label-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .label-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; }
    .label-remove { background: none; border: none; cursor: pointer; font-size: 16px; line-height: 1; opacity: 0.6; transition: opacity 0.2s; color: inherit; padding: 0; margin-left: 2px; }
    .label-remove:hover { opacity: 1; }
    .label-picker { position: relative; }
    .label-dropdown { position: absolute; bottom: calc(100% + 8px); right: 0; width: 100%; min-width: 260px; background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); z-index: 100; display: flex; flex-direction: column; overflow: hidden; animation: fadeIn 0.2s; }
    .label-dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
    .label-dropdown-header h4 { margin: 0; font-size: 14px; color: var(--text); font-weight: 600; }
    .close-btn-sm { background: var(--hover); border: none; cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); transition: all 0.2s; }
    .close-btn-sm:hover { background: var(--border); color: var(--text); }
    .label-list { max-height: 200px; overflow-y: auto; padding: 8px; }
    .label-option { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: none; background: none; cursor: pointer; border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--text); width: 100%; text-align: left; transition: background 0.15s; }
    .label-option:hover { background: var(--hover); }
    .label-option.selected { background: var(--accent-muted); }
    .label-option-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .label-dot { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 1px rgba(0,0,0,0.1) inset; }
    .label-check { color: var(--accent); display: flex; align-items: center; justify-content: center; }
    .label-create-section { padding: 12px 16px 16px; border-top: 1px solid var(--border); background: var(--hover); display: flex; flex-direction: column; gap: 12px; }
    .label-create-section h5 { margin: 0; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .label-create-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--card-bg); color: var(--text); box-sizing: border-box; outline: none; }
    .label-create-input:focus { border-color: var(--accent); }
    .label-color-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; padding: 4px 0; }
    .label-color-btn { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 0 0 1px rgba(0,0,0,0.1) inset; padding: 0; flex-shrink: 0; }
    .label-color-btn:hover { transform: scale(1.15); box-shadow: var(--shadow-sm); }
    .label-color-btn.active { border-color: var(--text); transform: scale(1.15); box-shadow: 0 0 0 2px var(--card-bg) inset; }
    .btn-full { width: 100%; padding: 8px; }

    /* Checklists */
    .checklist-section { background: var(--hover); border-radius: var(--radius-md); padding: 16px; border: 1px solid var(--border); }
    .checklist-section .section-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .btn-icon-sm { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 4px; transition: all 0.2s; display: flex; align-items: center; }
    .btn-icon-sm:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .cl-progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .cl-progress-text { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 28px; }
    .cl-progress-bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
    .cl-progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .cl-progress-fill.complete { background: #10b981; }
    .cl-progress-pct { font-size: 12px; font-weight: 600; color: var(--text-muted); min-width: 32px; text-align: right; }
    .cl-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; margin-bottom: 2px; }
    .cl-item:hover { background: var(--card-bg); }
    .cl-item input[type=checkbox] { width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer; flex-shrink: 0; }
    .cl-item-text { font-size: 14px; color: var(--text); flex: 1; line-height: 1.4; }
    .cl-item.done .cl-item-text { text-decoration: line-through; color: var(--text-muted); }
    .cl-item-delete { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 16px; padding: 2px 6px; border-radius: 4px; opacity: 0; transition: all 0.15s; }
    .cl-item:hover .cl-item-delete { opacity: 1; }
    .cl-item-delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .cl-add-form input { width: 100%; border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; background: var(--card-bg); color: var(--text); box-sizing: border-box; outline: none; }
    .cl-add-btn { background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 13px; font-weight: 500; padding: 8px 10px; border-radius: 6px; transition: all 0.15s; width: 100%; text-align: left; }
    .cl-add-btn:hover { background: var(--card-bg); color: var(--text); }
    .checklist-title-input { width: 100%; border: 1px solid var(--accent); border-radius: var(--radius-md); padding: 8px 12px; font-size: 14px; background: var(--card-bg); color: var(--text); box-sizing: border-box; outline: none; }

    /* Responsive Breakpoints */
    @media (max-width: 768px) {
      .modal-layout { flex-direction: column; min-height: auto; }
      .modal-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--border); padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .modal-sidebar .danger-zone { grid-column: 1 / -1; margin-top: 16px; }
      .modal-main { padding: 24px 20px; }
      .card-title { font-size: 20px; margin-right: 32px; }
      .title-input { font-size: 20px; }
      .close-btn { top: 12px; right: 12px; }
    }
    @media (max-width: 480px) {
      .modal-sidebar { grid-template-columns: 1fr; }
    }
  `]
})
export class CardDetailComponent implements OnInit {
  @Input() card!: Card;
  @Input() boardId!: number;
  @Input() boardName!: string;
  @Input() workspaceName!: string;
  @Input() lists: BoardList[] = [];
  @Input() boardClosed = false;
  @Input() readOnly = false;
  @Input() wsVisibility: string = 'PRIVATE';
  @Input() isAdmin: boolean = false;
  @Output() closed = new EventEmitter<void>();

  noEdit(): boolean { return this.boardClosed || !this.isAdmin; }

  canEditStatus(): boolean {
    if (this.boardClosed) return false;
    if (this.isAdmin) return true;
    if (this.wsVisibility === 'PRIVATE') return true;
    return false;
  }

  canComment(): boolean {
    if (this.boardClosed) return false;
    if (this.isAdmin) return true;
    if (this.wsVisibility === 'PRIVATE') return true;
    return false;
  }

  canUpload(): boolean {
    if (this.boardClosed) return false;
    return true; // Any member can upload in both PRIVATE and PUBLIC workspaces
  }

  @Output() updated = new EventEmitter<Card>();
  @Output() deleted = new EventEmitter<Card>();

  comments = signal<Comment[]>([]);
  attachments = signal<CardAttachment[]>([]);
  editingTitle = signal(false);
  editingDesc = signal(false);
  editingCommentId = signal<number | null>(null);
  replyTo = signal<number | null>(null);
  fileDragActive = signal(false);
  uploading = signal(false);
  userCache = signal<Map<number, User>>(new Map());
  workspaceMembers = signal<WorkspaceMember[]>([]);

  // Labels & Checklists
  boardLabels = signal<Label[]>([]);
  cardLabels = signal<Label[]>([]);
  checklists = signal<Checklist[]>([]);
  showLabelPicker = signal(false);
  addingChecklist = signal(false);
  addingItemToChecklist = signal<number | null>(null);

  titleVal = '';
  descVal = '';
  statusVal: CardStatus = 'TO_DO';
  priorityVal: CardPriority = 'MEDIUM';
  dueDateVal = '';
  moveListVal = 0;
  coverVal = '';
  newComment = '';
  editingCommentText = '';
  replyText = '';
  assigneeVal: number | null = null;
  newLabelName = '';
  newLabelColor = '#6366f1';
  newChecklistTitle = '';
  newItemText = '';

  coverColors = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#f43f5e','#8b5cf6','#06b6d4'];

  listName = () => this.lists.find(l => l.listId === this.card.listId)?.name ?? 'Unknown';

  constructor(private cardSvc: CardService, private commentSvc: CommentService, private authSvc: AuthService, private wsSvc: WorkspaceService, private labelSvc: LabelService) {}

  ngOnInit(): void {
    this.titleVal = this.card.title;
    this.descVal = this.card.description ?? '';
    this.statusVal = this.card.status;
    this.priorityVal = this.card.priority;
    this.dueDateVal = this.card.dueDate ?? '';
    this.moveListVal = this.card.listId;
    this.coverVal = this.card.coverColor ?? '';
    this.assigneeVal = this.card.assigneeUserId;
    this.loadComments();
    this.loadAttachments();
    this.loadUserCache();
    this.loadWorkspaceMembers();
    this.loadBoardLabels();
    this.loadCardLabels();
    this.loadChecklists();
  }

  close(): void { this.closed.emit(); }

  loadComments(): void {
    this.commentSvc.getComments(this.card.cardId).subscribe({
      next: c => {
        this.comments.set(c);
        this.resolveCommentUsers(c);
      }
    });
  }

  loadWorkspaceMembers(): void {
    if (!this.card.workspaceId) return;
    this.wsSvc.getWorkspace(this.card.workspaceId).subscribe({
      next: ws => {
        this.workspaceMembers.set(ws.members ?? []);
        // Make sure these users are in the cache
        this.resolveUsers(ws.members?.map(m => m.userId) ?? []);
      }
    });
  }

  private loadUserCache(): void {
    // Fetch all users via search with empty query to populate cache
    this.authSvc.searchUsers('').subscribe({
      next: users => {
        const cache = new Map<number, User>();
        for (const u of users) cache.set(u.userId, u);
        this.userCache.set(cache);
      }
    });
  }

  private resolveCommentUsers(comments: Comment[]): void {
    const unknownIds = new Set<number>();
    for (const c of comments) {
      unknownIds.add(c.authorUserId);
      for (const r of c.replies ?? []) {
        unknownIds.add(r.authorUserId);
      }
    }
    this.resolveUsers(Array.from(unknownIds));
  }

  private resolveUsers(userIds: number[]): void {
    const cache = this.userCache();
    const unknownIds = userIds.filter(id => !cache.has(id));
    
    // For unknown users, try searching by their ID
    for (const id of unknownIds) {
      this.authSvc.searchUsers(String(id)).subscribe({
        next: users => {
          const updated = new Map(this.userCache());
          for (const u of users) updated.set(u.userId, u);
          this.userCache.set(updated);
        }
      });
    }
  }

  getUserName(userId: number): string {
    const u = this.userCache().get(userId);
    return u?.fullName || u?.username || `User #${userId}`;
  }

  getUserInitial(userId: number): string {
    const u = this.userCache().get(userId);
    return u?.fullName?.[0]?.toUpperCase() || u?.username?.[0]?.toUpperCase() || String(userId);
  }

  currentUserInitial(): string {
    const u = this.authSvc.currentUser();
    return u?.fullName?.[0]?.toUpperCase() || u?.username?.[0]?.toUpperCase() || 'U';
  }

  startEditTitle(): void { this.titleVal = this.card.title; this.editingTitle.set(true); }
  saveTitle(): void {
    const title = this.titleVal.trim();
    this.editingTitle.set(false);
    if (!title || title === this.card.title) return;
    this.cardSvc.updateCard(this.card.cardId, { title }).subscribe({ next: c => this.updated.emit(c) });
  }

  startEditDesc(): void { this.descVal = this.card.description ?? ''; this.editingDesc.set(true); }
  saveDesc(): void {
    this.editingDesc.set(false);
    this.cardSvc.updateCard(this.card.cardId, { description: this.descVal }).subscribe({ next: c => this.updated.emit(c) });
  }

  updateField(): void {
    const req: UpdateCardRequest = {
      status: this.statusVal,
      boardName: this.boardName,
      workspaceName: this.workspaceName
    };
    if (!this.noEdit()) {
      req.priority = this.priorityVal;
      req.dueDate = this.dueDateVal || undefined;
      req.assigneeUserId = this.assigneeVal === null ? 0 : this.assigneeVal;
    }
    this.cardSvc.updateCard(this.card.cardId, req).subscribe({ next: c => this.updated.emit(c) });
  }

  moveCard(): void {
    if (this.moveListVal === this.card.listId) return;
    this.cardSvc.moveCard(this.card.cardId, { targetListId: this.moveListVal, newPosition: 1 }).subscribe({ next: c => this.updated.emit(c) });
  }

  setCover(color: string): void {
    this.coverVal = color;
    this.cardSvc.updateCard(this.card.cardId, { coverColor: color || undefined }).subscribe({ next: c => this.updated.emit(c) });
  }

  archiveCard(): void {
    if (!confirm('Archive this card?')) return;
    this.cardSvc.archiveCard(this.card.cardId).subscribe({ next: () => { this.deleted.emit(this.card); } });
  }

  // ── Attachments ─────────────────────────────────────────────────────────

  loadAttachments(): void {
    this.cardSvc.getAttachments(this.card.cardId).subscribe({ next: a => this.attachments.set(a) });
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.fileDragActive.set(true); }
  onDragLeave(e: DragEvent): void { this.fileDragActive.set(false); }

  onFileDrop(e: DragEvent): void {
    e.preventDefault();
    this.fileDragActive.set(false);
    const files = e.dataTransfer?.files;
    if (files) this.uploadFiles(Array.from(files));
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  uploadFiles(files: File[]): void {
    for (const file of files) {
      // Limit file size to 2MB to prevent DB bloat since we are using Base64
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 2MB for local storage.`);
        continue;
      }
      this.uploading.set(true);
      
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        this.cardSvc.addAttachment(this.card.cardId, {
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileUrl: fileUrl
        }).subscribe({
          next: att => { this.attachments.update(a => [...a, att]); this.uploading.set(false); },
          error: () => this.uploading.set(false)
        });
      };
      reader.onerror = () => this.uploading.set(false);
      reader.readAsDataURL(file);
    }
  }

  deleteAttachment(att: CardAttachment): void {
    this.cardSvc.deleteAttachment(this.card.cardId, att.attachmentId).subscribe({
      next: () => this.attachments.update(a => a.filter(x => x.attachmentId !== att.attachmentId))
    });
  }

  downloadAttachment(att: CardAttachment): void {
    const link = document.createElement('a');
    link.href = att.fileUrl;
    link.download = att.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  postComment(): void {
    const content = this.newComment.trim();
    if (!content) return;
    this.commentSvc.addComment(this.card.cardId, { content }).subscribe({
      next: c => { this.comments.update(list => [...list, c]); this.newComment = ''; }
    });
  }

  startEditComment(c: Comment): void { this.editingCommentId.set(c.commentId); this.editingCommentText = c.content; }
  saveComment(c: Comment): void {
    this.commentSvc.updateComment(this.card.cardId, c.commentId, { content: this.editingCommentText }).subscribe({
      next: updated => { this.comments.update(list => list.map(x => x.commentId === updated.commentId ? updated : x)); this.editingCommentId.set(null); }
    });
  }

  deleteComment(c: Comment): void {
    this.commentSvc.deleteComment(this.card.cardId, c.commentId).subscribe({
      next: () => this.comments.update(list => list.filter(x => x.commentId !== c.commentId))
    });
  }

  postReply(parent: Comment): void {
    const content = this.replyText.trim();
    if (!content) return;
    this.commentSvc.addComment(this.card.cardId, { content, parentCommentId: parent.commentId }).subscribe({
      next: reply => {
        this.comments.update(list => list.map(c => c.commentId === parent.commentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c));
        this.replyText = ''; this.replyTo.set(null);
      }
    });
  }

  // ── Labels ──────────────────────────────────────────────────────────────

  loadBoardLabels(): void {
    this.labelSvc.getLabelsByBoard(this.boardId).subscribe({
      next: labels => this.boardLabels.set(labels)
    });
  }

  loadCardLabels(): void {
    this.labelSvc.getLabelsForCard(this.card.cardId).subscribe({
      next: labels => this.cardLabels.set(labels)
    });
  }

  isLabelOnCard(lbl: Label): boolean {
    return this.cardLabels().some(l => l.labelId === lbl.labelId);
  }

  toggleLabelOnCard(lbl: Label): void {
    if (this.isLabelOnCard(lbl)) {
      this.labelSvc.removeLabelFromCard(this.card.cardId, lbl.labelId).subscribe({
        next: () => this.cardLabels.update(list => list.filter(l => l.labelId !== lbl.labelId))
      });
    } else {
      this.labelSvc.addLabelToCard(this.card.cardId, lbl.labelId).subscribe({
        next: () => this.cardLabels.update(list => [...list, lbl])
      });
    }
  }

  removeLabelFromCard(lbl: Label): void {
    this.labelSvc.removeLabelFromCard(this.card.cardId, lbl.labelId).subscribe({
      next: () => this.cardLabels.update(list => list.filter(l => l.labelId !== lbl.labelId))
    });
  }

  createLabel(): void {
    const name = this.newLabelName.trim();
    if (!name) return;
    this.labelSvc.createLabel(this.boardId, { name, color: this.newLabelColor }).subscribe({
      next: lbl => {
        this.boardLabels.update(list => [...list, lbl]);
        this.newLabelName = '';
        this.newLabelColor = '#6366f1';
      }
    });
  }

  getContrastColor(hex: string): string {
    if (!hex) return '#fff';
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1e293b' : '#ffffff';
  }

  // ── Checklists ──────────────────────────────────────────────────────────

  loadChecklists(): void {
    this.labelSvc.getChecklistsByCard(this.card.cardId).subscribe({
      next: cls => this.checklists.set(cls)
    });
  }

  createChecklist(): void {
    const title = this.newChecklistTitle.trim();
    if (!title) return;
    this.labelSvc.createChecklist(this.card.cardId, { title }).subscribe({
      next: cl => {
        this.checklists.update(list => [...list, cl]);
        this.newChecklistTitle = '';
        this.addingChecklist.set(false);
      }
    });
  }

  deleteChecklist(cl: Checklist): void {
    if (!confirm(`Delete checklist "${cl.title}"?`)) return;
    this.labelSvc.deleteChecklist(cl.checklistId).subscribe({
      next: () => this.checklists.update(list => list.filter(c => c.checklistId !== cl.checklistId))
    });
  }

  toggleChecklistItem(item: ChecklistItem): void {
    this.labelSvc.toggleItem(item.itemId).subscribe({
      next: updated => {
        this.checklists.update(cls => cls.map(cl => {
          if (cl.checklistId !== item.checklistId) return cl;
          const items = cl.items.map(i => i.itemId === updated.itemId ? updated : i);
          const completedCount = items.filter(i => i.completed).length;
          return { ...cl, items, completedCount, totalCount: items.length, progressPercent: items.length ? Math.round(completedCount / items.length * 100) : 0 };
        }));
      }
    });
  }

  addChecklistItem(cl: Checklist): void {
    const text = this.newItemText.trim();
    if (!text) return;
    this.labelSvc.addItem(cl.checklistId, { text }).subscribe({
      next: item => {
        this.checklists.update(cls => cls.map(c => {
          if (c.checklistId !== cl.checklistId) return c;
          const items = [...c.items, item];
          return { ...c, items, totalCount: items.length, progressPercent: items.length ? Math.round(c.completedCount / items.length * 100) : 0 };
        }));
        this.newItemText = '';
      }
    });
  }

  deleteChecklistItem(cl: Checklist, item: ChecklistItem): void {
    this.labelSvc.deleteItem(item.itemId).subscribe({
      next: () => {
        this.checklists.update(cls => cls.map(c => {
          if (c.checklistId !== cl.checklistId) return c;
          const items = c.items.filter(i => i.itemId !== item.itemId);
          const completedCount = items.filter(i => i.completed).length;
          return { ...c, items, completedCount, totalCount: items.length, progressPercent: items.length ? Math.round(completedCount / items.length * 100) : 0 };
        }));
      }
    });
  }
}
