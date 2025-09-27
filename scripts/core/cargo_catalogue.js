// scripts/core/cargo_catalogue.js

const cargoCatalogue = {
    "spare_parts": {
        id: "spare_parts",
        name: "Spare Parts Crate",
        description: "A standard container of universal machinery parts.",
        baseValue: 150,
        size: 5 // How much cargo space it takes up
    },
    "medical_supplies": {
        id: "medical_supplies",
        name: "Medical Supplies",
        description: "Sterile medical equipment and consumables.",
        baseValue: 400,
        size: 10
    },
    "rover_data_core": {
        id: "rover_data_core",
        name: "Rover Data Core",
        description: "A hardened data core containing valuable research.",
        baseValue: 2000,
        size: 2 // Data cores are small
    }
};