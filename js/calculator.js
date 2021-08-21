class ToolViewModel {
	constructor(tool) {
		this.name = tool.name;
		this.applicableEnchantmentNames = tool.applicableEnchantmentNames;
		this.applicableEnchantments = [];
	}

	isApplicable = (enchantment) => {
		let foundEnchantment = this.applicableEnchantments.filter(applicableEnchantment => applicableEnchantment.name === enchantment.name)[0];
		if (foundEnchantment) {
			return true;
		}
		return false;
	}

	collectConflicts = (enchant) => {
		let conflicts = this.getAppliedEnchantments().filter(
			(selectedEncant) =>
				selectedEncant.name !== enchant.name &&
				selectedEncant.conflictGroups !== null && enchant.conflictGroups !== null &&
				selectedEncant.conflictGroups.some(groupNo => enchant.conflictGroups.includes(groupNo))
		);
		return conflicts;
	}

	getAppliedEnchantments = () => {
		let enchantments = this.applicableEnchantments.filter(enchantment => enchantment.selectedLevel !== null);
		return enchantments;
	}


	getEncahntment = (enchant) => {
		let foundEnchantment = this.applicableEnchantments.filter(enchantment => enchantment.name === enchant.name)[0];

		return foundEnchantment;
	}

	hasEnchantments = (enchant) => {
		let foundEnchantment = this.getAppliedEnchantments().filter(enchantment => enchantment.name === enchant.name)[0];
		if (foundEnchantment) {
			return true;
		}
		return false;
	}

	getLevel = (enchant) => {
		let foundEnchantment = this.getEncahntment(enchant);
		if (foundEnchantment) {
			return foundEnchantment.selectedLevel;
		}
		return null;
	}
}

class EnchantmentViewModel {
	constructor(enchantment) {
		this.name = enchantment.name;
		this.maxLevel = enchantment.maxLevel;
		this.itemMultiplier = enchantment.itemMultiplier;
		this.bookMultiplier = enchantment.bookMultiplier;
		this.conflictGroups = enchantment.conflictGroups;
		this.selectedLevel = null;
	}

	setLevel = (selectedLevel) => {
		if (selectedLevel > this.maxLevel) {
			throw `Can't set '${selectedLevel}' for Enchantment: '${this.name}' as max is only:'${this.maxLevel}'`;
		}

		if (this.selectedLevel === selectedLevel) {
			this.selectedLevel = null;
		}
		else {
			this.selectedLevel = selectedLevel;
		}
	}

	isSelected = () => {
		if (this.selectedLevel === null) {
			return false;
		}
		return true;
	}

	isLevelSelected = (level) => {
		if (this.isSelected()) {
			return this.selectedLevel === level;
		}
		return false;
	}
}

class InputTool {
	constructor(callbacks) {
		this.selectedTool = null;
		this.isDamaged = false;
		this.priorWorkPenalty = 0;
		this.callbacks = callbacks;
	}

	onChanged = () => {
		if (this.callbacks.onChanged) {
			this.callbacks.onChanged(this.selectedTool);
		}
	}

	setSelected = (tool) => {
		this.selectedTool = tool;
	}
}

class Calculator {
	constructor(dataProvider) {

		let targetToolViewModels = [];
		let sacrificeToolViewModels = [];
		let enchantmentTable = {};
		dataProvider.enchantments.forEach(enchantment => {
			enchantmentTable[enchantment.name] = enchantment;
		});

		dataProvider.tools.forEach(tool => {
			let targetToolViewModel = new ToolViewModel(tool);
			let sacrificeTToolViewModel = new ToolViewModel(tool);
			targetToolViewModel.applicableEnchantmentNames.forEach(applicableEnchantmentName => {
				targetToolViewModel.applicableEnchantments.push(new EnchantmentViewModel(enchantmentTable[applicableEnchantmentName]));
				sacrificeTToolViewModel.applicableEnchantments.push(new EnchantmentViewModel(enchantmentTable[applicableEnchantmentName]));
			});
			targetToolViewModels.push(targetToolViewModel);
			sacrificeToolViewModels.push(sacrificeTToolViewModel);
		});



		this.data = {
			targetTools: targetToolViewModels,
			sacrificeTools: sacrificeToolViewModels
		};
		this.inputData = {
			target: new InputTool({ onChanged: this.onInputSelectionChanged }),
			sacrifice: new InputTool({ onChanged: this.onInputSelectionChanged }),
			sync: false,
			swap: false
		};
		this.outputLog = [];
	}


	onInputSelectionChanged = (selectedTool) => {
		console.log('onInputSelectionChanged');
		if (this.inputData.sync) {
			this.syncToolSelector(selectedTool.name, this.inputData.target, this.data.targetTools);
			this.syncToolSelector(selectedTool.name, this.inputData.sacrifice, this.data.sacrificeTools);
		}
	}

	syncToolSelector = (toolName, inputTool, allTools) => {

		if (toolName !== inputTool.name) {
			let foundIndex = this.data.targetTools.findIndex(tool => tool.name === toolName);
			inputTool.setSelected(allTools[foundIndex]);
		}
	}

	startCostCalculation = () => {
		console.log("Calculator-testFunc", this.inputData.target.selectedTool,
			this.inputData.target.isDamaged,
			this.inputData.target.priorWorkPenalty);

		this.outputLog = [];


		let target = (this.inputData.swap ? this.inputData.sacrifice : this.inputData.target);
		let sacrifice = (this.inputData.swap ? this.inputData.target : this.inputData.sacrifice);

		let targetTool = target.selectedTool;
		let sacrificeTool = sacrifice.selectedTool;
		let total_cost = 0;
		// For each enchantment on the sacrifice:
		sacrificeTool.getAppliedEnchantments().forEach(enchant => {

			// Ignore any enchantment that cannot be applied to the target (e.g. Protection on a sword).
			if (!targetTool.isApplicable(enchant)) {
				this.outputLog.push(`${enchant.name} not applicable`);
			}
			else {
				// Add one level for every incompatible enchantment on the target (In Java Edition).
				let conflicts = targetTool.collectConflicts(enchant);
				//If the enchantment is not compatible
				if (conflicts && conflicts.length > 0) {
					this.outputLog.push(`${enchant.name} is incompatible with ${conflicts.map(conflict => conflict.name).join(',')}! Cost: 1`);
					total_cost += 1;
				}
				else {
					// If the target has the enchantment as well
					let targetEnchant = targetTool.getEncahntment(enchant);
					if (targetTool.hasEnchantments(enchant)) {
						//If sacrifice level is equal, the target gains one level, unless it is already at the maximum level for that enchantment.
						if (targetEnchant.selectedLevel === enchant.selectedLevel) {
							targetEnchant.selectedLevel = Math.min(
								targetEnchant.selectedLevel + 1,
								enchant.maxLevel
							);
						}
						//If sacrifice level is greater, the target is raised to the sacrifice's level
						else if (targetEnchant.selectedLevel < enchant.selectedLevel) {
							targetEnchant.selectedLevel = enchant.selectedLevel;
						}
					}
					//If the target does not have the enchantment, it gains all levels of that enchantment
					else {
						targetEnchant.selectedLevel = enchant.selectedLevel;
					}

					// For Java Edition, add the final level of the enchantment on the resulting item multiplied by the multiplier from the table below.
					let multiplier = enchant.itemMultiplier;
					if (sacrificeTool.name === "Book") {
						multiplier = enchant.bookMultiplier;
					}
					let cost = multiplier * targetEnchant.selectedLevel;
					total_cost += cost;
					this.outputLog.push(
						`${enchant.name}: ${targetEnchant.selectedLevel} x ${multiplier} = ${cost}`
					);
				}

			}

		});

		//Calculate Penalty cost
		let target_penalty_cost = Math.pow(2, target.priorWorkPenalty) - 1;
		let sacrifice_penalty_cost = Math.pow(2, sacrifice.priorWorkPenalty) - 1;
		let penalty_cost = target_penalty_cost + sacrifice_penalty_cost;
		total_cost += penalty_cost;
		// new_penalty = Math.max(target_penalty, sacrifice_penalty);
		// target.prior_penalty = new_penalty + 1;
		this.outputLog.push(
			`Penalty Cost: ${target_penalty_cost} + ${sacrifice_penalty_cost} = ${penalty_cost}`
		);


		//Calculate Repair cost
		if (target.isDamaged && targetTool.name === sacrificeTool.name) {
			//Is it repairable
			total_cost += 2;
			this.outputLog.push("Repair Cost: 2");
		}

		this.outputLog.push(`Final Cost: ${total_cost}`);
	}
}

class OptimalEnchantOrderCalculator {
	
	constructor(dataProvider) {
		
		let targetToolViewModels = [];
		let sacrificeToolViewModels = [];
		let enchantmentTable = {};
		dataProvider.enchantments.forEach(enchantment => {
			enchantmentTable[enchantment.name] = enchantment;
		});

		dataProvider.tools.forEach(tool => {
			let targetToolViewModel = new ToolViewModel(tool);
			let sacrificeTToolViewModel = new ToolViewModel(tool);
			targetToolViewModel.applicableEnchantmentNames.forEach(applicableEnchantmentName => {
				targetToolViewModel.applicableEnchantments.push(new EnchantmentViewModel(enchantmentTable[applicableEnchantmentName]));
				sacrificeTToolViewModel.applicableEnchantments.push(new EnchantmentViewModel(enchantmentTable[applicableEnchantmentName]));
			});
			targetToolViewModels.push(targetToolViewModel);
			sacrificeToolViewModels.push(sacrificeTToolViewModel);
		});



		this.data = {
			targetTools: targetToolViewModels,
			sacrificeTools: sacrificeToolViewModels
		};
		this.inputData = {
			target: new InputTool({ onChanged: this.onInputSelectionChanged }),
			//sacrifice: new InputTool({ onChanged: this.onInputSelectionChanged }),
			
		};
		this.outputLog = [];
	}
}