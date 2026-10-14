"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderInput,
  FolderOutput,
  FolderPlus,
  MessageSquare,
  PanelLeftClose,
  Pencil,
  Pin,
  PinOff,
  Plus,
  SquarePen,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectDialog, type ProjectDialogValue } from "@/features/chat/project-dialog";
import { ProjectGlyph } from "@/features/chat/project-glyph";
import { buildRail, railTitle } from "@/lib/chat-rail";
import { colorTint } from "@/lib/project-style";
import { cn } from "@/lib/utils";
import type { ChatConversation, ChatProject } from "@/types/chat";

export interface ChatHistoryActions {
  /** No argument: New chat in the current project (SPEC-255); `null`: unfiled. */
  onNewChat: (projectId?: string | null) => void;
  onSelect: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  onPin: (conversationId: string, pinned: boolean) => void;
  onMove: (conversationId: string, projectId: string | null) => void;
  /** SPEC-255: click a project — it becomes current and a fresh thread opens in it. */
  onEnterProject: (projectId: string) => void;
  /** SPEC-255 Patches: click the current project again, or its menu — back to unfiled. */
  onLeaveProject: () => void;
  onCreateProject: (value: ProjectDialogValue) => Promise<unknown>;
  onUpdateProject: (projectId: string, value: ProjectDialogValue) => Promise<void>;
  onDeleteProject: (projectId: string) => void;
}

interface ChatHistoryProps extends ChatHistoryActions {
  conversations: ChatConversation[] | null;
  /** null until history has loaded (SPEC-249). */
  projects: ChatProject[] | null;
  activeId: string | null;
  /** SPEC-255: the project the owner is in; New chat lands there. */
  currentProjectId: string | null;
  /** Desktop rail only (SPEC-032): renders the collapse control when given. */
  onCollapse?: () => void;
}

const SECTION_LABEL =
  "flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase";

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-1 pb-1.5">
      <p className={SECTION_LABEL}>
        {title}
        <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      </p>
      {action}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed px-3 py-3 text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

/** One chat row: select on click, chevron menu for pin / move / delete; a filed
 * chat carries its project's colour dot (SPEC-255). */
function ConversationRow({
  conversation,
  projects,
  isActive,
  onSelect,
  onDelete,
  onPin,
  onMove,
  nested = false,
}: {
  conversation: ChatConversation;
  projects: ChatProject[];
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onMove: (id: string, projectId: string | null) => void;
  nested?: boolean;
}) {
  const pinned = Boolean(conversation.pinnedAt);
  const project = projects.find((candidate) => candidate.id === conversation.projectId) ?? null;
  return (
    <li className="group relative" data-conversation-row>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={isActive ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg py-2 pr-9 text-left text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          nested ? "pl-7" : "pl-3",
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        )}
      >
        {pinned ? (
          <Pin className="size-3.5 shrink-0 text-ai" aria-hidden />
        ) : (
          <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <span className="fade-end min-w-0 flex-1" title={project ? `${conversation.title} · ${project.name}` : undefined}>
          {railTitle(conversation.title)}
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for: ${conversation.title}`}
            className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:opacity-100"
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => onPin(conversation.id, !pinned)}>
            {pinned ? <PinOff aria-hidden /> : <Pin aria-hidden />}
            {pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput aria-hidden />
              Move to project
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              {projects.length === 0 ? (
                <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
              ) : (
                projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    disabled={conversation.projectId === project.id}
                    onSelect={() => onMove(conversation.id, project.id)}
                  >
                    <Folder aria-hidden />
                    <span className="truncate">{project.name}</span>
                  </DropdownMenuItem>
                ))
              )}
              {conversation.projectId && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onMove(conversation.id, null)}>
                    No project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => onDelete(conversation.id)}>
            <Trash2 aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

/**
 * Conversation history rail (SPEC-032, sectioned in SPEC-249): New chat, then
 * Projects / Pinned / Chats — each with its own header, count, height,
 * scrollbar and empty state; chat rows carry a ⋯ menu, projects a ⋯ menu of
 * their own and a create / rename dialog.
 */
export function ChatHistory({
  conversations,
  projects,
  activeId,
  onNewChat,
  onSelect,
  onDelete,
  onPin,
  onMove,
  onEnterProject,
  onLeaveProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onCollapse,
  currentProjectId,
}: ChatHistoryProps) {
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; project: ChatProject } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ChatProject | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const loading = conversations === null || projects === null;
  const rail = loading ? null : buildRail(conversations, projects);
  const currentProject = projects?.find((project) => project.id === currentProjectId) ?? null;

  function toggleProject(projectId: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  const rowProps = {
    projects: projects ?? [],
    onSelect,
    onDelete,
    onPin,
    onMove,
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="min-w-0 flex-1 justify-start"
          onClick={() => onNewChat()}
          title={currentProject ? `New chat in ${currentProject.name}` : "New chat"}
          data-new-chat
        >
          <SquarePen className="size-4" aria-hidden />
          <span className="fade-end min-w-0 flex-1 text-left">New chat</span>
        </Button>
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Collapse chat history"
            title="Collapse chat history"
            onClick={onCollapse}
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      {loading || !rail ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="mt-3 h-4 w-20" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* ── Projects ─────────────────────────────────────────────────── */}
          <section aria-label="Projects" data-rail-section="projects" className="flex min-h-0 shrink-0 flex-col">
            <SectionHeader
              title="Projects"
              count={rail.projects.length}
              action={
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "create" })}
                  aria-label="New project"
                  title="New project"
                  className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              }
            />
            {rail.projects.length === 0 ? (
              <EmptyNote>
                No projects yet. Group the chats about one supplier, one season or one problem.
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "create" })}
                  className="mt-2 inline-flex items-center gap-1 font-medium text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FolderPlus className="size-3.5" aria-hidden />
                  New project
                </button>
              </EmptyNote>
            ) : (
              <ol className="scrollbar-subtle max-h-[40svh] space-y-0.5 overflow-y-auto">
                {rail.projects.map(({ project, conversations: filed }) => {
                  const open = !collapsed.has(project.id);
                  const isCurrent = currentProjectId === project.id;
                  return (
                    <li key={project.id} data-project-row data-current={isCurrent ? "true" : undefined}>
                      <div
                        className={cn(
                          "group relative flex items-center rounded-lg transition-colors hover:bg-accent/50",
                          isCurrent && cn(colorTint(project.color), "text-foreground"),
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleProject(project.id)}
                          aria-expanded={open}
                          aria-label={`${open ? "Fold" : "Unfold"} ${project.name}`}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ChevronRight
                            className={cn("size-3.5 transition-transform", open && "rotate-90")}
                            aria-hidden
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrent) {
                              onLeaveProject();
                              return;
                            }
                            onEnterProject(project.id);
                            setCollapsed((current) => {
                              const next = new Set(current);
                              next.delete(project.id);
                              return next;
                            });
                          }}
                          aria-current={isCurrent ? "true" : undefined}
                          className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-9 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <ProjectGlyph icon={project.icon} color={project.color} className="size-3.5" />
                          <span className="fade-end min-w-0 flex-1">{project.name}</span>
                          <span className="ml-auto text-[11px] font-normal tabular-nums text-muted-foreground">
                            {filed.length}
                          </span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Actions for project: ${project.name}`}
                              className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity outline-none group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:opacity-100"
                            >
                              <ChevronDown className="size-3.5" aria-hidden />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onSelect={() => onNewChat(project.id)}>
                              <SquarePen aria-hidden />
                              New chat here
                            </DropdownMenuItem>
                            {isCurrent && (
                              <DropdownMenuItem onSelect={onLeaveProject}>
                                <FolderOutput aria-hidden />
                                Leave project
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={() => setDialog({ mode: "edit", project })}>
                              <Pencil aria-hidden />
                              Rename · colour · icon
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setConfirmDelete(project)}
                            >
                              <Trash2 aria-hidden />
                              Delete project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {open &&
                        (filed.length === 0 ? (
                          <p className="py-1.5 pr-2 pl-9 text-xs text-muted-foreground">
                            Empty —{" "}
                            <button
                              type="button"
                              onClick={() => onNewChat(project.id)}
                              className="font-medium text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              start a chat here
                            </button>
                          </p>
                        ) : (
                          <ol className="space-y-1 py-1">
                            {filed.map((conversation) => (
                              <ConversationRow
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeId}
                                nested
                                {...rowProps}
                              />
                            ))}
                          </ol>
                        ))}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {/* ── Pinned ───────────────────────────────────────────────────── */}
          <section aria-label="Pinned chats" data-rail-section="pinned" className="flex min-h-0 shrink-0 flex-col">
            <SectionHeader title="Pinned" count={rail.pinned.length} />
            {rail.pinned.length === 0 ? (
              <EmptyNote>Pin a chat to keep it here — from the ⋯ on any chat.</EmptyNote>
            ) : (
              <ol className="scrollbar-subtle max-h-[28svh] space-y-1 overflow-y-auto">
                {rail.pinned.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === activeId}
                    {...rowProps}
                  />
                ))}
              </ol>
            )}
          </section>

          {/* ── Chats ────────────────────────────────────────────────────── */}
          <section aria-label="Chats" data-rail-section="chats" className="flex min-h-0 flex-1 flex-col">
            <SectionHeader title="Chats" count={rail.recentCount} />
            {rail.recentCount === 0 ? (
              <EmptyNote>No conversations yet. Start a new chat to ask about your store.</EmptyNote>
            ) : (
              <div className="scrollbar-subtle min-h-0 flex-1 space-y-4 overflow-y-auto">
                {rail.recent.map((group) => (
                  <section key={group.label} aria-label={group.label}>
                    <p className="px-1 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      {group.label}
                    </p>
                    <ol className="space-y-1">
                      {group.conversations.map((conversation) => (
                        <ConversationRow
                          key={conversation.id}
                          conversation={conversation}
                          isActive={conversation.id === activeId}
                          {...rowProps}
                        />
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ProjectDialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        initial={
          dialog?.mode === "edit"
            ? { name: dialog.project.name, color: dialog.project.color, icon: dialog.project.icon }
            : undefined
        }
        onSubmit={async (value) => {
          if (dialog?.mode === "edit") await onUpdateProject(dialog.project.id, value);
          else await onCreateProject(value);
        }}
      />

      <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{confirmDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The chats inside are kept — they move back under Chats. Only the project goes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) onDeleteProject(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
