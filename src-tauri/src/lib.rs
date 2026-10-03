use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
    Migration {
        version: 1,
        description: "create_initial_schema",
        sql: include_str!("../migrations/001_initial_schema.sql"),
        kind: MigrationKind::Up,
    },
    Migration {
        version: 2,
        description: "add_provider_neutral_external_ids",
        sql: include_str!("../migrations/002_external_provider.sql"),
        kind: MigrationKind::Up,
    },
];

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:movie_logger.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running Movie Logger");
}
