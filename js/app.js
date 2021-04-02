$(document).ready(function () {
    $(".addEnchantBtn").click(addEnchant);
    $(".type").change(function () {
        if ($(this).children("select").val() != "Book") {
            $(this).siblings(".enchant").html("");
        }
    });
    $(".findCost").click(setFinalCost);
});

function addEnchant() {
    let tool_type = $(this).parent().siblings(".type").children("select").val();
    let total_enchant = $(this).parent().siblings(".enchant").children().length;
    // console.log(total_enchant)
    let enchantSelectNode = $(
        `<div class="enchant_${total_enchant}"><select class="enchant_name">
        
        </select>
        <select class="enchant_lv">
        
        </select>
        <button class="enchant_remove removeEnchantBtn">X</button></div>`
    );

    let appliedEnchant = [];
    for (i = 0; i < total_enchant; i += 1) {
        appliedEnchant.push(
            $(this)
                .parent()
                .siblings(".enchant")
                .children(`.enchant_${i}`)
                .children(".enchant_name")
                .val()
        );
    }

    let unappliedEnchant = [];
    for (name of applicable_enchant[tool_type]) {
        if (!appliedEnchant.includes(name)) {
            unappliedEnchant.push(name);
        }
    }
    console.log(unappliedEnchant);

    if (unappliedEnchant.length > 0) {
        // Add enchant select node
        $(this).parent().siblings(".enchant").append(enchantSelectNode);

        // Add applicable enchantment list
        for (name of unappliedEnchant) {
            $(this)
                .parent()
                .siblings(".enchant")
                .children(`.enchant_${total_enchant}`)
                .children(".enchant_name")
                .append($(`<option>${name}</option>`));
        }

        // Add applicable enchantment level for new enchantment
        let enchant_name = $(this)
            .parent()
            .siblings(".enchant")
            .children(`.enchant_${total_enchant}`)
            .children(".enchant_name")
            .val();
        $(this)
            .parent()
            .siblings(".enchant")
            .children(`.enchant_${total_enchant}`)
            .children(".enchant_lv")
            .html(getLevelOption(enchant_name));

        // Create event that update applicable enchantment level everytime enchantment name is changed
        $(this)
            .parent()
            .siblings(".enchant")
            .children(`.enchant_${total_enchant}`)
            .children(".enchant_name")
            .change(function () {
                let name = $(this).val();
                $(this).siblings(".enchant_lv").html(getLevelOption(name));
            });

        //Create event for remove button
        $(".removeEnchantBtn").click(removeEnchant);
    }

}

function removeEnchant() {
    const enchant = $(this).parent();
    const enchantments = enchant.parent();
    enchant.remove();
    //re-create enchantments index
    enchantments.children().each((i, elem) => {
        $(elem).attr("class", `enchant_${i}`);
    });
}

function getTool(which) {
    tool = {
        type: $(`#${which} > .type > select`).val(),
        enchantments: {},
        prior_penalty: Number($(`#${which}_penalty`).val()),
    };

    for (i = 0; i < $(`#${which} > .enchant`).children().length; i += 1) {
        let enchant_name = $(
            `#${which} > .enchant > .enchant_${i} > .enchant_name`
        ).val();
        if (Object.keys(enchant_list).includes(enchant_name)) {
            let enchant_lv = $(
                `#${which} > .enchant > .enchant_${i} > .enchant_lv`
            ).val();
            tool["enchantments"][enchant_name] = Number(enchant_lv);
        }
    }
    return tool;
}

function setFinalCost() {
    const [total_cost, result_tool] = findCost();
    console.log(total_cost, result_tool);
    $("#total_cost").text("Cost : " + total_cost);

    let tool_summary_text = "";
    for (enchant in result_tool.enchantments) {
        tool_summary_text +=
            enchant + " " + result_tool.enchantments[enchant] + "<br/>";
    }
    $("#result_tool").html(tool_summary_text);
}

function getLevelOption(name) {
    var max_lv = enchant_list[name].max;

    let optionHtml = "";
    for (let i = 1; i <= max_lv; i += 1) {
        optionHtml += `<option>${i}</option>`;
    }
    return optionHtml;
}