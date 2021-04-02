function findCost() {
    function isConflictWithTarget(name) {
        var isConflict = false
        for (conflict_group of conflict) {
            if (conflict_group.includes(name)) {
                for (other_name of conflict_group) {
                    if (
                        other_name != name &&
                        Object.keys(target.enchantments).includes(other_name)
                    ) {
                        isConflict = true
                        $('#log').append(
                            name + ' is incompatible with ' + other_name + '!'
                        )
                    }
                }
            }
        }
        return isConflict
    }

    $('#log').text('') // reset textarea

    target = getTool('target')
    sacrifice = getTool('sacrifice')

    if ($('#swapTool').is(':checked')) {
        target = getTool('sacrifice')
        sacrifice = getTool('target')
    }

    total_cost = 0

    // For each enchantment on the sacrifice:
    for (name in sacrifice.enchantments) {
        // Ignore any enchantment that cannot be applied to the target (e.g. Protection on a sword).
        if (!applicable_enchant[target.type].includes(name)) {
            // console.log(name + ' not applicable')
            $('#log').append(name + ' not applicable')
            $('#log').append('\n')
            continue
        }

        // Add one level for every incompatible enchantment on the target (In Java Edition).
        if (isConflictWithTarget(name)) {
            // console.log(name + ' has conflict. Cost: 1')
            $('#log').append(' Cost: 1')
            $('#log').append('\n')
            total_cost += 1
        }

        //If the enchantment is compatible
        else {
            // If the target has the enchantment as well
            if (name in target.enchantments) {
                // console.log(
                //     'Combining ' +
                //         name +
                //         ' ' +
                //         target.enchantments[name] +
                //         ' and ' +
                //         name +
                //         ' ' +
                //         sacrifice.enchantments[name] +
                //         '...'
                // )
                $('#log').append(
                    'Combining ' +
                        name +
                        ' ' +
                        target.enchantments[name] +
                        ' and ' +
                        name +
                        ' ' +
                        sacrifice.enchantments[name] +
                        '...'
                )
                $('#log').append('\n')
                //If sacrifice level is equal, the target gains one level, unless it is already at the maximum level for that enchantment.
                if (target.enchantments[name] == sacrifice.enchantments[name]) {
                    target.enchantments[name] = Math.min(
                        target.enchantments[name] + 1,
                        enchant_list[name].max
                    )
                }
                //If sacrifice level is greater, the target is raised to the sacrifice's level
                else if (
                    target.enchantments[name] < sacrifice.enchantments[name]
                ) {
                    target.enchantments[name] = sacrifice.enchantments[name]
                }
            }

            //If the target does not have the enchantment, it gains all levels of that enchantment
            else {
                target.enchantments[name] = sacrifice.enchantments[name]
            }
            // $('#log').append(
            //     "Target's " + name + ' becomes ' + target.enchantments[name]
            // )

            // For Java Edition, add the final level of the enchantment on the resulting item multiplied by the multiplier from the table below.
            multiplier = enchant_list[name].mul_item
            if (sacrifice.type == 'Book') {
                multiplier = enchant_list[name].mul_book
            }
            cost = multiplier * target.enchantments[name]
            total_cost += cost
            $('#log').append(
                name +
                    ' ' +
                    target.enchantments[name] +
                    '. Multiplier: ' +
                    multiplier +
                    '. Cost: ' +
                    cost
            )
            $('#log').append('\n')
        }

        // $('#log').append('Total cost: ' + total_cost)
        // $('#log').append('\n')
    }

    //Calculate Penalty cost
    let target_penalty = target.prior_penalty
    let sacrifice_penalty = sacrifice.prior_penalty
    let new_penalty = Math.max(target_penalty, sacrifice_penalty)
    target.prior_penalty = new_penalty + 1

    let target_penalty_cost = Math.pow(2, target_penalty) - 1
    let sacrifice_penalty_cost = Math.pow(2, sacrifice_penalty) - 1
    let total_penalty_cost = target_penalty_cost + sacrifice_penalty_cost
    total_cost += total_penalty_cost
    $('#log').append(
        'Penalty Cost: ' +
            target_penalty_cost +
            ' + ' +
            sacrifice_penalty_cost +
            ' = ' +
            total_penalty_cost
    )
    $('#log').append('\n')

    //Calculate Repair cost
    if ($('#target-damaged').is(':checked') && target.type == sacrifice.type){
        total_cost += 2
        $('#log').append('Repair Cost: 2\n')
    }

    $('#log').append('Final Cost: ')
    $('#log').append(total_cost)
    $('#log').append('\n')

    // console.log(target)

    return [total_cost, target]
}
