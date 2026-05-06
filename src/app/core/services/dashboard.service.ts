import { Injectable } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, shareReplay, switchMap, catchError } from 'rxjs/operators';
import { WorkspaceService } from './workspace.service';
import { BoardService } from './board.service';
import { CardService } from './card.service';
import { Workspace } from '../models/workspace.model';

export interface DashboardData {
  workspaces: Workspace[];
  totalBoards: number;
  totalMembers: number;
  myCardsCount: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  /**
   * Cached stream of user's workspaces. Shared across shell, dashboard, and other components
   * to eliminate duplicate /api/workspaces/my requests.
   */
  readonly workspaces$: Observable<Workspace[]>;
  
  /**
   * Aggregated dashboard data stream.
   * Batches required API calls and computes total values, using shareReplay to cache the result.
   */
  readonly dashboardData$: Observable<DashboardData>;

  private forceReload = new BehaviorSubject<void>(undefined);

  constructor(
    private wsService: WorkspaceService,
    private boardService: BoardService,
    private cardService: CardService
  ) {
    // 1. Workspaces stream (Cached)
    this.workspaces$ = this.forceReload.pipe(
      switchMap(() => this.wsService.getMyWorkspaces().pipe(
        catchError(() => of([]))
      )),
      shareReplay(1) // Emits the last cached result to any new subscriber immediately
    );

    // 2. Aggregated Dashboard Data stream (Cached)
    this.dashboardData$ = this.workspaces$.pipe(
      switchMap(workspaces => {
        if (!workspaces || workspaces.length === 0) {
          return of({ workspaces: [], totalBoards: 0, totalMembers: 0, myCardsCount: 0 });
        }

        // a. Fetch My Cards count (1 API call instead of N+1)
        const myCards$ = this.cardService.getMyCards().pipe(
          map(cards => cards.length),
          catchError(() => of(0))
        );

        // b. Fetch boards for all workspaces in parallel
        const boardReqs$ = workspaces.map(ws => {
          const memberIds = ws.members?.map(m => m.userId) ?? [];
          return this.boardService.getBoardsByWorkspace(ws.workspaceId, memberIds).pipe(catchError(() => of([])));
        });

        // c. Fetch detailed workspaces to get all members
        const memberReqs$ = workspaces.map(ws => 
          this.wsService.getWorkspace(ws.workspaceId).pipe(catchError(() => of(null)))
        );

        // Run independent batches concurrently
        const safeBoardReqs$ = boardReqs$.length ? forkJoin(boardReqs$) : of([] as any[]);
        const safeMemberReqs$ = memberReqs$.length ? forkJoin(memberReqs$) : of([] as (Workspace | null)[]);

        return combineLatest([
          safeBoardReqs$,
          safeMemberReqs$,
          myCards$
        ]).pipe(
          map(([boardResults, fullWorkspaces, myCardsCount]) => {
            // Aggregate boards
            const totalBoards = boardResults.reduce((acc, boards) => acc + boards.length, 0);
            
            // Aggregate unique collaborators across all workspaces
            const uniqueIds = new Set<number>();
            fullWorkspaces.forEach(ws => {
              if (ws && ws.members) {
                ws.members.forEach(m => uniqueIds.add(m.userId));
              }
            });

            return {
              workspaces,
              totalBoards,
              totalMembers: uniqueIds.size,
              myCardsCount
            };
          })
        );
      }),
      shareReplay(1) // Cache the heavily computed dashboard data
    );
  }

  /**
   * Triggers a refetch of the data streams
   */
  reload(): void {
    this.forceReload.next();
  }
}
