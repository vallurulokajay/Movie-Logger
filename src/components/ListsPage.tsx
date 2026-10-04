
import { useEffect, useMemo, useState } from "react";
import {
  createList,
  deleteList,
  getListTitles,
  getLists,
  removeTitleFromList,
  updateList,
  type LocalTitle,
  type UserList,
} from "../lib/db";

type Props = {
  onAddTitle: () => void;
  onChanged: () => Promise<void>;
  onOpenTitle: (titleId: number) => void;
};

function yearOf(title: LocalTitle) {
  return (
    title.release_date ||
    title.first_air_date ||
    "—"
  ).slice(0, 4);
}

export default function ListsPage({
  onAddTitle,
  onChanged,
  onOpenTitle,
}: Props) {
  const [lists, setLists] = useState<UserList[]>([]);
  const [selectedListId, setSelectedListId] =
    useState<number | null>(null);
  const [titles, setTitles] =
    useState<LocalTitle[]>([]);
  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] =
    useState<"grid" | "list">("grid");

  const [showCreate, setShowCreate] =
    useState(false);
  const [newName, setNewName] =
    useState("");
  const [newDescription, setNewDescription] =
    useState("");

  const [showEdit, setShowEdit] =
    useState(false);
  const [editName, setEditName] =
    useState("");
  const [editDescription, setEditDescription] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function loadLists(
    preferredId?: number,
  ) {
    setLoading(true);

    try {
      const nextLists = await getLists();
      setLists(nextLists);

      const activeId =
        preferredId &&
        nextLists.some(
          (list) => list.id === preferredId,
        )
          ? preferredId
          : selectedListId &&
              nextLists.some(
                (list) =>
                  list.id === selectedListId,
              )
            ? selectedListId
            : nextLists[0]?.id ?? null;

      setSelectedListId(activeId);

      if (activeId !== null) {
        setTitles(
          await getListTitles(activeId),
        );
      } else {
        setTitles([]);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load lists.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLists();
  }, []);

  async function selectList(id: number) {
    setSelectedListId(id);
    setQuery("");
    setMessage("");

    try {
      setTitles(
        await getListTitles(id),
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load list.",
      );
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      return;
    }

    try {
      const id = await createList(
        newName,
        newDescription,
      );

      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setMessage("List created.");

      await loadLists(id);
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create list.",
      );
    }
  }

  function beginEdit() {
    const active = lists.find(
      (list) => list.id === selectedListId,
    );

    if (!active) {
      return;
    }

    setEditName(active.name);
    setEditDescription(
      active.description ?? "",
    );
    setShowEdit(true);
  }

  async function handleEdit() {
    if (
      selectedListId === null ||
      !editName.trim()
    ) {
      return;
    }

    try {
      await updateList(
        selectedListId,
        editName,
        editDescription,
      );

      setShowEdit(false);
      setMessage("List updated.");

      await loadLists(selectedListId);
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update list.",
      );
    }
  }

  async function handleDelete() {
    const active = lists.find(
      (list) => list.id === selectedListId,
    );

    if (!active) {
      return;
    }

    if (
      !window.confirm(
        `Delete "${active.name}"? The titles themselves will not be deleted.`,
      )
    ) {
      return;
    }

    try {
      await deleteList(active.id);

      setMessage("List deleted.");
      await loadLists();
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete list.",
      );
    }
  }

  async function handleRemove(
    titleId: number,
  ) {
    if (selectedListId === null) {
      return;
    }

    try {
      await removeTitleFromList(
        titleId,
        selectedListId,
      );

      setTitles(
        await getListTitles(selectedListId),
      );

      await loadLists(selectedListId);
      await onChanged();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not remove title.",
      );
    }
  }

  const activeList = useMemo(
    () =>
      lists.find(
        (list) => list.id === selectedListId,
      ) ?? null,
    [lists, selectedListId],
  );

  const filteredTitles = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return titles;
    }

    return titles.filter((title) =>
      title.title.toLowerCase().includes(q),
    );
  }, [titles, query]);

  if (loading && lists.length === 0) {
    return (
      <section className="page-section">
        <div className="movie-logs-empty">
          <p className="muted">
            Loading your lists...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            YOUR COLLECTIONS
          </p>
          <h1>Lists</h1>
        </div>

        <button
          className="primary"
          onClick={() => setShowCreate(true)}
        >
          + New List
        </button>
      </div>

      {message && (
        <div className="list-message">
          {message}
        </div>
      )}

      {showCreate && (
        <div className="list-form-card">
          <p className="eyebrow">
            NEW LIST
          </p>

          <input
            autoFocus
            value={newName}
            onChange={(e) =>
              setNewName(e.target.value)
            }
            placeholder="List name"
          />

          <textarea
            value={newDescription}
            onChange={(e) =>
              setNewDescription(
                e.target.value,
              )
            }
            placeholder="Description (optional)"
            rows={3}
          />

          <div>
            <button
              className="primary"
              onClick={() =>
                void handleCreate()
              }
            >
              Create List
            </button>

            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
                setNewDescription("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {lists.length === 0 ? (
        <div className="movie-logs-empty">
          <h2>No lists yet</h2>

          <p className="muted">
            Create your first personal list
            when you are ready.
          </p>

          <button
            className="primary"
            onClick={() => setShowCreate(true)}
          >
            + New List
          </button>
        </div>
      ) : (
        <>
          <div className="list-card-grid">
            {lists.map((list) => (
              <button
                className={
                  selectedListId === list.id
                    ? "list-card selected"
                    : "list-card"
                }
                key={list.id}
                onClick={() =>
                  void selectList(list.id)
                }
              >
                <span className="eyebrow">
                  {list.count}{" "}
                  {list.count === 1
                    ? "TITLE"
                    : "TITLES"}
                </span>

                <h2>{list.name}</h2>

                <p>
                  {list.description ||
                    "No description"}
                </p>

                <strong>
                  Open list →
                </strong>
              </button>
            ))}
          </div>

          {activeList && (
            <div className="list-details">
              <div className="list-details-head">
                <div>
                  <p className="eyebrow">
                    LIST DETAILS
                  </p>

                  <h2>{activeList.name}</h2>

                  {activeList.description && (
                    <p className="muted">
                      {activeList.description}
                    </p>
                  )}
                </div>

                <div className="list-detail-actions">
                  <button
                    onClick={beginEdit}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      void handleDelete()
                    }
                  >
                    Delete
                  </button>

                  <button
                    className="primary"
                    onClick={onAddTitle}
                  >
                    + Add Title
                  </button>
                </div>
              </div>

              <div className="list-toolbar">
                <input
                  value={query}
                  onChange={(e) =>
                    setQuery(e.target.value)
                  }
                  placeholder="Search this list..."
                />

                <span className="toolbar-spacer" />

                <button
                  className={
                    viewMode === "grid"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setViewMode("grid")
                  }
                >
                  ▦
                </button>

                <button
                  className={
                    viewMode === "list"
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setViewMode("list")
                  }
                >
                  ☰
                </button>
              </div>

              {filteredTitles.length === 0 ? (
                <div className="list-empty">
                  <h3>
                    {titles.length === 0
                      ? "This list is empty"
                      : "No matching titles"}
                  </h3>

                  <p className="muted">
                    {titles.length === 0
                      ? "Add a movie or TV show from Home."
                      : "Try another search."}
                  </p>

                  {titles.length === 0 && (
                    <button
                      className="primary"
                      onClick={onAddTitle}
                    >
                      + Add Title
                    </button>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="list-title-grid">
                  {filteredTitles.map(
                    (title) => (
                      <article
                        className="list-title-card clickable"
                        key={title.id}
                        onClick={() =>
                          onOpenTitle(title.id)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            onOpenTitle(title.id);
                          }
                        }}
                      >
                        <div className="list-title-poster">
                          {title.poster_path ? (
                            <img
                              src={
                                title.poster_path
                              }
                              alt={
                                title.title
                              }
                            />
                          ) : (
                            <span>
                              {title.media_type ===
                              "movie"
                                ? "MOVIE"
                                : "TV SHOW"}
                            </span>
                          )}
                        </div>

                        <strong>
                          {title.title}
                        </strong>

                        <small>
                          {yearOf(title)}
                        </small>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRemove(
                              title.id,
                            );
                          }}
                        >
                          Remove
                        </button>
                      </article>
                    ),
                  )}
                </div>
              ) : (
                <div className="list-title-table">
                  <div className="list-title-row header">
                    <span>Poster</span>
                    <span>Title</span>
                    <span>Type</span>
                    <span>Year</span>
                    <span />
                  </div>

                  {filteredTitles.map(
                    (title) => (
                      <div
                        className="list-title-row clickable"
                        key={title.id}
                        onClick={() =>
                          onOpenTitle(title.id)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            onOpenTitle(title.id);
                          }
                        }}
                      >
                        <div className="list-small-poster">
                          {title.poster_path ? (
                            <img
                              src={
                                title.poster_path
                              }
                              alt={
                                title.title
                              }
                            />
                          ) : (
                            <span>
                              {title.media_type ===
                              "movie"
                                ? "M"
                                : "TV"}
                            </span>
                          )}
                        </div>

                        <strong>
                          {title.title}
                        </strong>

                        <span>
                          {title.media_type ===
                          "movie"
                            ? "Movie"
                            : "TV Show"}
                        </span>

                        <span>
                          {yearOf(title)}
                        </span>

                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleRemove(
                              title.id,
                            );
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showEdit && activeList && (
        <div className="modal-backdrop">
          <div className="list-modal">
            <p className="eyebrow">
              EDIT LIST
            </p>

            <h2>{activeList.name}</h2>

            <input
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value)
              }
              placeholder="List name"
            />

            <textarea
              value={editDescription}
              onChange={(e) =>
                setEditDescription(
                  e.target.value,
                )
              }
              placeholder="Description (optional)"
              rows={4}
            />

            <div className="list-modal-actions">
              <button
                className="primary"
                onClick={() =>
                  void handleEdit()
                }
              >
                Save Changes
              </button>

              <button
                onClick={() =>
                  setShowEdit(false)
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
