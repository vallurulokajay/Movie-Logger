
import { useEffect, useState } from "react";
import {
  createTag,
  deleteTag,
  getTags,
  renameTag,
  type Tag,
} from "../lib/db";

export default function TagsManager() {
  const [tags, setTags] =
    useState<Tag[]>([]);
  const [newTag, setNewTag] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [message, setMessage] =
    useState("");

  async function load() {
    setLoading(true);

    try {
      setTags(await getTags());
    } catch {
      setMessage("Could not load tags.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!newTag.trim()) {
      return;
    }

    try {
      await createTag(newTag);
      setNewTag("");
      setMessage("Tag created.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create tag.",
      );
    }
  }

  async function handleRename(tag: Tag) {
    const next = window.prompt(
      "Rename tag:",
      tag.name,
    );

    if (next === null) {
      return;
    }

    try {
      await renameTag(tag.id, next);
      setMessage("Tag renamed.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not rename tag.",
      );
    }
  }

  async function handleDelete(tag: Tag) {
    if (
      !window.confirm(
        `Delete "${tag.name}"? It will also be removed from titles using it.`,
      )
    ) {
      return;
    }

    try {
      await deleteTag(tag.id);
      setMessage("Tag deleted.");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete tag.",
      );
    }
  }

  return (
    <div className="settings-tags">
      <div className="settings-section-head">
        <div>
          <p className="eyebrow">
            PERSONAL CLASSIFICATION
          </p>

          <h2>Tags</h2>

          <p className="muted">
            Personal labels such as Favourite,
            Comfort, Childhood or Must Rewatch.
          </p>
        </div>
      </div>

      <div className="tag-create-row">
        <input
          value={newTag}
          onChange={(e) =>
            setNewTag(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void handleCreate();
            }
          }}
          placeholder="New tag..."
        />

        <button
          className="primary"
          onClick={() =>
            void handleCreate()
          }
        >
          + Create
        </button>
      </div>

      {loading ? (
        <p className="muted">
          Loading tags...
        </p>
      ) : tags.length === 0 ? (
        <div className="tags-empty">
          No tags yet.
        </div>
      ) : (
        <div className="tag-manager-list">
          {tags.map((tag) => (
            <div
              className="tag-manager-row"
              key={tag.id}
            >
              <span>{tag.name}</span>

              <div>
                <button
                  onClick={() =>
                    void handleRename(tag)
                  }
                >
                  Rename
                </button>

                <button
                  onClick={() =>
                    void handleDelete(tag)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className="settings-status">
          {message}
        </p>
      )}
    </div>
  );
}
