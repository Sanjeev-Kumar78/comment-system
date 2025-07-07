import React, { useState, useEffect, useCallback } from "react";
import { commentsAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import type { Comment } from "../services/api";
import {
  validateComment,
  sanitizeText,
  commentRateLimiter,
} from "../utils/validation";
import { useCommentsRefresh } from "../contexts/CommentsRefreshContext";

export const CommentsSection: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(
    new Set()
  );
  const [ownershipMap, setOwnershipMap] = useState<Record<string, boolean>>({});
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>(
    {}
  );

  const { user } = useAuth();
  const { refreshKey } = useCommentsRefresh();

  const loadComments = useCallback(async () => {
    console.log("🔄 Loading comments...", { user: user?.email });
    try {
      // Load comments first
      console.log("📨 Fetching comments...");
      const commentsData = await commentsAPI.getAll();
      console.log("✅ Comments loaded:", commentsData?.length, "comments");
      setComments(commentsData);

      // Fetch ownership map
      if (user) {
        console.log("📨 Fetching ownership map...");
        const ownershipData = await commentsAPI.checkOwnership();
        console.log("✅ Ownership map loaded");
        setOwnershipMap(ownershipData.ownershipMap);
      }
    } catch (error) {
      console.error("❌ Failed to load comments:", error);
      setError("Failed to load comments");
    }
  }, [user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Refresh comments when refreshKey changes (triggered by notifications)
  useEffect(() => {
    if (refreshKey > 0) {
      console.log("🔄 Refreshing comments due to notification check");
      loadComments();
    }
  }, [refreshKey, loadComments]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate comment
    const validation = validateComment(newComment);
    if (!validation.isValid) {
      setError(validation.error || "Invalid comment");
      return;
    }

    // Check rate limiting
    const userKey = user?.id || "anonymous";
    if (!commentRateLimiter.canProceed(userKey)) {
      const remainingTime = Math.ceil(
        commentRateLimiter.getRemainingTime(userKey) / 1000
      );
      setError(
        `Please wait ${remainingTime} seconds before posting another comment`
      );
      return;
    }

    setLoading(true);
    setError(""); // Clear any previous errors

    try {
      // Sanitize the comment text
      const sanitizedText = sanitizeText(newComment.trim());
      await commentsAPI.create({ text: sanitizedText });
      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error("Failed to create comment:", error);
      setError("Failed to create comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentId: string) => {
    // Validate reply
    const validation = validateComment(replyText);
    if (!validation.isValid) {
      setError(validation.error || "Invalid reply");
      return;
    }

    // Check rate limiting
    const userKey = user?.id || "anonymous";
    if (!commentRateLimiter.canProceed(userKey)) {
      const remainingTime = Math.ceil(
        commentRateLimiter.getRemainingTime(userKey) / 1000
      );
      setError(
        `Please wait ${remainingTime} seconds before posting another reply`
      );
      return;
    }

    setLoading(true);
    setError(""); // Clear any previous errors

    try {
      // Sanitize the reply text
      const sanitizedText = sanitizeText(replyText.trim());
      await commentsAPI.create({ text: sanitizedText, parentId });
      setReplyText("");
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error("Failed to create reply:", error);
      setError("Failed to create reply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    // Validate edited text
    const validation = validateComment(editText);
    if (!validation.isValid) {
      setError(validation.error || "Invalid comment text");
      return;
    }

    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    setError(""); // Clear any previous errors

    try {
      // Sanitize the edited text
      const sanitizedText = sanitizeText(editText.trim());
      await commentsAPI.update(id, { text: sanitizedText });
      setEditingId(null);
      setEditText("");
      await loadComments();
    } catch (error) {
      console.error("Failed to update comment:", error);
      setError("Failed to update comment. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmMessage =
      "Are you sure you want to delete this comment? This action cannot be undone and will remove all related notifications.";
    if (!confirm(confirmMessage)) return;

    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    try {
      await commentsAPI.delete(id);
      await loadComments();
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Failed to delete comment:", error);
      setError("Failed to delete comment. Please try again.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRestore = async (id: string) => {
    const confirmMessage =
      "Do you want to restore this comment? It will be visible again.";
    if (!confirm(confirmMessage)) return;

    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    try {
      await commentsAPI.restore(id);
      await loadComments();
      setError(""); // Clear any previous errors
      // Success message could be added here if needed
    } catch (error: unknown) {
      console.error("Failed to restore comment:", error);

      // Enhanced error handling
      let errorMessage = "Failed to restore comment. Please try again.";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response: { status: number } };
        if (axiosError.response?.status === 403) {
          errorMessage =
            "This comment can no longer be restored (15-minute window expired).";
        } else if (axiosError.response?.status === 404) {
          errorMessage = "Comment not found or has already been restored.";
        }
      }

      setError(errorMessage);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRestoreTimeRemaining = (deletedAt: string) => {
    const deletedTime = new Date(deletedAt).getTime();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
    const timeElapsed = now - deletedTime;
    const timeRemaining = fifteenMinutes - timeElapsed;

    if (timeRemaining <= 0) {
      return { canRestore: false, timeLeft: "Restoration period expired" };
    }

    const minutesLeft = Math.floor(timeRemaining / 60000);
    const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);

    return {
      canRestore: true,
      timeLeft: `${minutesLeft}m ${secondsLeft}s remaining`,
    };
  };

  const toggleCollapse = (commentId: string) => {
    const newCollapsed = new Set(collapsedComments);
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId);
    } else {
      newCollapsed.add(commentId);
    }
    setCollapsedComments(newCollapsed);
  };

  const renderComment = (comment: Comment, depth = 0) => {
    // Use direct userId comparison - much simpler and more reliable
    const isOwner = ownershipMap[comment.id] ?? false;
    const isDeleted = comment.deletedAt;
    const isCollapsed = collapsedComments.has(comment.id);
    const isActionLoading = loadingActions[comment.id] || false;

    console.log(
      `🔍 Comment ${comment.id}: UserID=${comment.userId}, CurrentUserID=${user?.id}, IsOwner=${isOwner}`
    );

    // Auto-collapse very deep comments (depth > 10) by default to handle up to 15 levels
    const shouldAutoCollapse =
      depth > 10 && comment.replies && comment.replies.length > 0;

    return (
      <div
        key={comment.id}
        className={`border rounded-lg p-3 ${depth > 0 ? "mt-2" : ""} ${
          depth === 0
            ? "bg-white shadow-sm"
            : depth <= 3
            ? "bg-gray-50"
            : depth <= 7
            ? "bg-gray-100"
            : depth <= 10
            ? "bg-gray-200"
            : "bg-gray-300"
        }`}
        style={{
          marginLeft: depth > 0 ? `${Math.min(depth * 16, 200)}px` : "0", // Increased indent with cap at 200px for 15 levels
          borderLeft:
            depth > 0
              ? `3px solid ${
                  depth <= 2
                    ? "#3b82f6"
                    : depth <= 5
                    ? "#10b981"
                    : depth <= 8
                    ? "#8b5cf6"
                    : depth <= 12
                    ? "#f59e0b"
                    : "#ef4444"
                }`
              : "none",
          paddingLeft: "16px",
          borderRadius: depth > 5 ? "8px" : "12px", // Smaller radius for deeper nesting
        }}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            {/* Thread indicator for deep nesting */}
            {depth > 0 && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                {depth <= 3 ? (
                  <span className="text-blue-600">
                    {"→".repeat(Math.min(depth, 3))}
                  </span>
                ) : depth <= 6 ? (
                  <>
                    <span className="text-green-600">{"→".repeat(2)}</span>
                    <span className="text-green-700 font-bold text-sm">
                      {depth}
                    </span>
                  </>
                ) : depth <= 10 ? (
                  <>
                    <span className="text-purple-600">{"→".repeat(2)}</span>
                    <span className="text-purple-700 font-bold text-sm">
                      {depth}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-600">{"→".repeat(2)}</span>
                    <span className="text-red-700 font-bold text-sm">
                      {depth}
                    </span>
                  </>
                )}
              </div>
            )}
            <span className="font-semibold text-blue-700 truncate">
              {comment.user.firstName} {comment.user.lastName}
              {isOwner && (
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  You
                </span>
              )}
            </span>
            {depth > 0 && (
              <span
                className={`text-xs px-2 py-1 rounded flex-shrink-0 font-medium ${
                  depth <= 2
                    ? "text-blue-700 bg-blue-100 border border-blue-200"
                    : depth <= 5
                    ? "text-green-700 bg-green-100 border border-green-200"
                    : depth <= 8
                    ? "text-purple-700 bg-purple-100 border border-purple-200"
                    : depth <= 12
                    ? "text-yellow-700 bg-yellow-100 border border-yellow-200"
                    : "text-red-700 bg-red-100 border border-red-200"
                }`}
              >
                {depth === 1
                  ? "Reply"
                  : depth <= 5
                  ? `L${depth}`
                  : `Deep-${depth}`}
              </span>
            )}
            <span className="text-gray-500 text-sm flex-shrink-0">
              {formatDate(comment.createdAt)}
            </span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-gray-400 text-xs flex-shrink-0">
                (edited)
              </span>
            )}
          </div>
          {/* Collapse button for replies */}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => toggleCollapse(comment.id)}
              className={`text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded-full flex-shrink-0 transition-all duration-200 ${
                depth > 8
                  ? "bg-gray-200 hover:bg-gray-300"
                  : "hover:bg-gray-100"
              }`}
              title={
                collapsedComments.has(comment.id)
                  ? `Expand ${comment.replies.length} replies`
                  : `Collapse ${comment.replies.length} replies`
              }
            >
              {collapsedComments.has(comment.id) ? (
                <span className="flex items-center space-x-1">
                  <span className="text-blue-600">➕</span>
                  <span className="text-xs font-medium">
                    {comment.replies.length}
                  </span>
                </span>
              ) : (
                <span className="text-red-600">➖</span>
              )}
            </button>
          )}
        </div>

        {isDeleted ? (
          <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">🗑️</span>
              <span className="font-medium">
                [This comment has been deleted]
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Deleted on {formatDate(comment.deletedAt!)}
            </div>
            {isOwner &&
              (() => {
                const restoreInfo = getRestoreTimeRemaining(comment.deletedAt!);
                return (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">
                      {restoreInfo.timeLeft}
                    </div>
                    {restoreInfo.canRestore ? (
                      <button
                        onClick={() => handleRestore(comment.id)}
                        disabled={isActionLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                        title="Restore this comment"
                      >
                        <span>↩️</span>
                        <span>
                          {isActionLoading ? "Restoring..." : "Restore"}
                        </span>
                      </button>
                    ) : (
                      <div className="text-xs text-red-500 italic">
                        ⏰ Restoration period has expired
                      </div>
                    )}
                  </div>
                );
              })()}
          </div>
        ) : (
          <>
            {editingId === comment.id ? (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-green-600 text-lg">✏️</span>
                  <span className="text-sm text-green-700 font-semibold">
                    Editing your comment
                  </span>
                </div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-vertical text-gray-900 bg-white shadow-sm"
                  rows={4}
                />
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {editText.length > 0 && `${editText.length} characters`}
                  </span>
                  <div className="space-x-3">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={isActionLoading || !editText.trim()}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center space-x-2"
                      title="Save changes"
                    >
                      <span>💾</span>
                      <span>
                        {isActionLoading ? "Saving..." : "Save Changes"}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-semibold flex items-center space-x-2"
                      title="Cancel editing"
                    >
                      <span>❌</span>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-800 mb-3 break-words">{comment.text}</p>

                <div className="flex flex-wrap gap-3 text-sm">
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 border border-transparent hover:border-blue-200"
                    title="Reply to this comment"
                  >
                    <span>💬</span>
                    <span className="font-medium">Reply</span>
                    {comment.replies && comment.replies.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                        {comment.replies.length}
                      </span>
                    )}
                  </button>

                  {isOwner && (
                    <>
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 px-3 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 border border-transparent hover:border-green-200"
                        title="Edit this comment"
                      >
                        <span>✏️</span>
                        <span className="font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isActionLoading}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-full flex items-center space-x-1 transition-all duration-200 border border-transparent hover:border-red-200 disabled:opacity-50"
                        title="Delete this comment"
                      >
                        <span>🗑️</span>
                        <span className="font-medium">
                          {isActionLoading ? "Deleting..." : "Delete"}
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {replyingTo === comment.id && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-blue-600 text-lg">💬</span>
                      <span className="text-sm text-blue-700 font-semibold">
                        Replying to {comment.user.firstName}{" "}
                        {comment.user.lastName}
                      </span>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a thoughtful reply..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical text-gray-900 bg-white shadow-sm"
                      rows={3}
                    />
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {replyText.length > 0 &&
                          `${replyText.length} characters`}
                      </span>
                      <div className="space-x-3">
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={loading || !replyText.trim()}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center space-x-2"
                          title="Post your reply"
                        >
                          <span>💬</span>
                          <span>{loading ? "Posting..." : "Post Reply"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          className="bg-gray-500 text-white px-6 py-2 rounded-lg text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-semibold flex items-center space-x-2"
                          title="Cancel reply"
                        >
                          <span>❌</span>
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Render replies with increased depth */}
        {comment.replies &&
          comment.replies.length > 0 &&
          !isCollapsed &&
          !shouldAutoCollapse && (
            <div className="mt-4 space-y-2">
              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
            </div>
          )}

        {/* Show collapsed message for auto-collapsed or manually collapsed comments */}
        {comment.replies &&
          comment.replies.length > 0 &&
          (isCollapsed || shouldAutoCollapse) && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <button
                onClick={() => toggleCollapse(comment.id)}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-md flex items-center space-x-2 transition-all duration-200 w-full text-left"
              >
                <span className="text-lg">➕</span>
                <span className="font-medium">
                  {shouldAutoCollapse && !collapsedComments.has(comment.id)
                    ? `Show ${
                        comment.replies.length
                      } deeply nested replies (Level ${depth + 1}+)`
                    : `Show ${comment.replies.length} hidden replies`}
                </span>
                <span className="ml-auto bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                  {comment.replies.length}
                </span>
              </button>
            </div>
          )}
      </div>
    );
  };

  // Filter top-level comments (no parent)
  const topLevelComments = comments.filter((comment) => !comment.parentId);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Comments</h2>
        <p className="text-gray-600">
          Join the conversation • Share your thoughts
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center space-x-2">
          <span className="text-xl">⚠️</span>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* New Comment Form */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form onSubmit={handleCreateComment}>
          <div className="mb-4">
            <label
              htmlFor="newComment"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              💭 Add a comment
            </label>
            <textarea
              id="newComment"
              name="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts? Share your ideas..."
              className="w-full px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-vertical text-gray-900 bg-white shadow-sm"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {newComment.length > 0 && `${newComment.length} characters`}
            </span>
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center space-x-2 shadow-sm"
              title="Post your comment"
            >
              <span>📝</span>
              <span>{loading ? "Posting..." : "Post Comment"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Discussion ({topLevelComments.length})
          </h3>
          {topLevelComments.length > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {comments.length} total comments
            </span>
          )}
        </div>

        <div className="space-y-6">
          {topLevelComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-500 text-lg mb-2">No comments yet</p>
              <p className="text-gray-400">
                Be the first to start the conversation!
              </p>
            </div>
          ) : (
            topLevelComments.map((comment) => renderComment(comment, 0))
          )}
        </div>
      </div>
    </div>
  );
};
