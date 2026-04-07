/**
 * Utility to validate layer checkboxes against available layers
 * @param {Object} layers - Available map layers
 */
export const validateLayerCheckboxes = () => {
    // Get all layer checkboxes
    const allCheckboxes = document.querySelectorAll('.layer-checkbox');
    const sumbermaCheckboxes = document.querySelectorAll('.pipa-sumberma-checkbox');

    console.log('Validating layer checkboxes...');
    console.log(`Total checkboxes: ${allCheckboxes.length}`);
    console.log(`Sumberma checkboxes: ${sumbermaCheckboxes.length}`);

    // Check pipe source checkboxes specifically
    if (sumbermaCheckboxes.length === 0) {
        console.error("No pipa-sumberma-checkbox elements found in the DOM");
        console.log("HTML of the container:");
        const container = document.querySelector('.pipa-sumberma-container');
        if (container) {
            console.log(container.innerHTML);
        } else {
            console.error("Pipe source container not found either");
        }
    }

    sumbermaCheckboxes.forEach(checkbox => {
        console.log(`Sumberma checkbox: id=${checkbox.id}, name=${checkbox.name}, class=${checkbox.className}`);
    });

    // Check HTML structure for issues
    const checkboxGroups = document.querySelectorAll('.checkbox-group');
    checkboxGroups.forEach(group => {
        const groupTitle = group.querySelector('.group-title')?.textContent || 'Unknown';
        const checkboxes = group.querySelectorAll('input[type="checkbox"]');
        console.log(`Group '${groupTitle}': ${checkboxes.length} checkboxes`);
    });
};
