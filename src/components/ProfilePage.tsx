
import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
} from "../lib/db";

type Props = {
  onSettings: () => void;
  onSaved?: () => Promise<void>;
};

export default function ProfilePage({
  onSettings,
  onSaved,
}: Props) {
  const [name, setName] = useState("Lokajay");
  const [bio, setBio] = useState("");
  const [picture, setPicture] =
    useState<string | null>(null);

  const [editing, setEditing] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [message, setMessage] =
    useState("");

  async function load() {
    try {
      const profile = await getProfile();

      setName(profile.name);
      setBio(profile.bio ?? "");
      setPicture(
        profile.profile_picture_path,
      );
    } catch {
      setMessage(
        "Could not load your profile.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handlePicture(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        "Profile pictures must be under 5 MB.",
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPicture(reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await updateProfile(
        name,
        bio,
        picture,
      );

      setEditing(false);
      setMessage("Profile saved.");
      await load();

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-head">
        <div>
          <p className="eyebrow">
            PERSONAL PROFILE
          </p>
          <h1>Profile</h1>
        </div>

        <button onClick={onSettings}>
          Settings
        </button>
      </div>

      <div className="profile-card profile-card-large">
        <div className="profile-avatar-large">
          {picture ? (
            <img
              src={picture}
              alt={name}
            />
          ) : (
            <span>
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="profile-content">
          {!editing ? (
            <>
              <h2>{name}</h2>

              <p className="profile-bio">
                {bio ||
                  "Your private Movie Logger profile."}
              </p>

              <button
                onClick={() =>
                  setEditing(true)
                }
              >
                Edit Profile
              </button>
            </>
          ) : (
            <div className="profile-editor">
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />
              </label>

              <label>
                Bio
                <textarea
                  rows={5}
                  value={bio}
                  onChange={(e) =>
                    setBio(e.target.value)
                  }
                  placeholder="Write something about yourself..."
                />
              </label>

              <label>
                Profile Picture
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePicture}
                />
              </label>

              <div className="profile-editor-actions">
                <button
                  className="primary"
                  disabled={saving}
                  onClick={() =>
                    void handleSave()
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>

                <button
                  onClick={() => {
                    setEditing(false);
                    void load();
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <p className="settings-status">
          {message}
        </p>
      )}
    </section>
  );
}
