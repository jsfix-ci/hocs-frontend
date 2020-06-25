const byUser = (userId) => ({ userUUID }) => userUUID === userId;
const byCaseReference = (a, b) => a.caseReference.localeCompare(b.caseReference);

const byPriority = (a, b) => {
    if (a.data.systemCalculatedPriority == undefined || b.data.systemCalculatedPriority == undefined) {
        return 0;
    } else {
        var aFloat = parseFloat(a.data.systemCalculatedPriority);
        var bFloat = parseFloat(b.data.systemCalculatedPriority);

        if (aFloat == bFloat) {
            return 0;
        }
        if (aFloat > bFloat) {
            return -1;
        }
        return 1;
    }
};

const defaultCaseSort = (a, b) => {
    var sortResult = byPriority(a, b);
    if (sortResult == 0) {
        sortResult = byCaseReference(a, b);
    }
    return sortResult;
};
const byLabel = (a, b) => a.label.localeCompare(b.label);
const isUnallocated = user => user === null;
const isOverdue = (configuration, deadline) => configuration.deadlinesEnabled && deadline && new Date(deadline) < Date.now();
const getOverdue = (configuration, data) => {
    if (!configuration.deadlinesEnabled) {
        return false;
    }
    const overdueCases = data.filter(({ deadline }) => isOverdue(configuration, deadline));
    return overdueCases.length;
};

const returnWorkstackColumns = (configuration, workstackData) => {
    const defaultColumnConfig = 'DEFAULT';
    const caseTypeForColumnConfig = workstackData.length > 0 ? workstackData[0].caseType : defaultColumnConfig;

    var getColumnsForWorkstack = configuration.workstackTypeColumns.find(
        item => item.workstackType === caseTypeForColumnConfig
    );

    if (getColumnsForWorkstack === undefined) {
        getColumnsForWorkstack = configuration.workstackTypeColumns.find(
            item => item.workstackType === defaultColumnConfig
        );
    }

    return getColumnsForWorkstack.workstackColumns;
};

const returnMyCasesWorkstackColumns = (configuration, workstackData) => {
    const defaultColumnConfig = 'DEFAULT';
    const caseTypeForColumnConfig = workstackData.length > 0 ? workstackData[0].caseType : defaultColumnConfig;

    var getColumnsForMyCases = configuration.workstackTypeColumns.find(
        item => item.workstackType === (caseTypeForColumnConfig + '_MY_CASES')
    );

    if (getColumnsForMyCases === undefined) {
        getColumnsForMyCases = configuration.workstackTypeColumns.find(
            item => item.workstackType === caseTypeForColumnConfig
        );
    }

    if (getColumnsForMyCases === undefined) {
        getColumnsForMyCases = configuration.workstackTypeColumns.find(
            item => item.workstackType === defaultColumnConfig
        );
    }

    return getColumnsForMyCases.workstackColumns;
};

const parseDate = (rawDate) => {
    const [date] = rawDate.match(/[0-9]{4}-[0-1][0-9]-[0-3][0-9]/g) || [];
    if (!date) {
        return null;
    }
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
};
const formatDate = (date) => date ? parseDate(date) : null;

const bindDisplayElements = fromStaticList => async (stage) => {
    stage.assignedTeamDisplay = await fromStaticList('S_TEAMS', stage.teamUUID);
    stage.caseTypeDisplayFull = await fromStaticList('S_CASETYPES', stage.caseType);
    if (stage.active) {
        stage.stageTypeDisplay = await fromStaticList('S_STAGETYPES', stage.stageType);
    } else {
        stage.stageTypeDisplay = 'Closed';
    }
    if (stage.userUUID) {
        stage.assignedUserDisplay = await fromStaticList('S_USERS', stage.userUUID) || 'Allocated';
    }
    stage.deadlineDisplay = formatDate(stage.deadline);
    if (stage.data && stage.data.RequestContributionDeadline) {
        stage.stageTypeContributionDeadlineDisplay = stage.stageTypeDisplay + ' due: ' + formatDate(stage.data.RequestContributionDeadline);
    } else {
        stage.stageTypeContributionDeadlineDisplay = stage.stageTypeDisplay;
    }
    return stage;
};

class Card {
    constructor({ label, value, type, count, overdue, unallocated }) {
        this.label = label;
        this.value = value;
        this.count = count || 0;
        this.type = type;
        this.tags = {
            overdue: overdue,
            allocated: unallocated
        };
    }
    incrementOverdue() { this.tags.overdue++; }
    incrementUnallocated() { this.tags.allocated++; }
    incrementCount() { this.count++; }
    getCount() { return this.count; }
}

const dashboardAdapter = async (data, { fromStaticList, logger, user, configuration }) => {
    const dashboardData = await Promise.all(data.stages
        .map(bindDisplayElements(fromStaticList)));
    const userCases = dashboardData.filter(byUser(user.uuid));
    const userCard = [new Card({
        label: 'Cases',
        count: userCases.length,
        overdue: getOverdue(configuration, userCases)
    })];
    const teamCards = dashboardData
        .reduce((cards, stage) => {
            const index = cards.findIndex(({ value }) => value === stage.teamUUID);
            if (index >= 0) {
                const card = cards[index];
                card.incrementCount();
                if (isOverdue(configuration, stage.deadline)) {
                    card.incrementOverdue();
                }
                if (isUnallocated(stage.userUUID)) {
                    card.incrementUnallocated();
                }
            } else {
                cards.push(new Card({
                    label: stage.assignedTeamDisplay,
                    value: stage.teamUUID,
                    type: 'team',
                    count: 1,
                    overdue: isOverdue(configuration, stage.deadline) ? 1 : 0,
                    unallocated: isUnallocated(stage.userUUID) ? 1 : 0
                }));
            }
            return cards;
        }, [])
        .sort((a, b) => (a.label && b.label) ? a.label.localeCompare(b.label) : 0);
    logger.debug('REQUEST_DASHBOARD', { user_cases: userCard[0].getCount(), teams: teamCards.length });
    return { user: userCard, teams: teamCards };
};

const userAdapter = async (data, { fromStaticList, logger, user, configuration }) => {
    const workstackData = await Promise.all(data.stages
        .filter(stage => stage.userUUID === user.uuid)
        .sort(defaultCaseSort)
        .map(bindDisplayElements(fromStaticList)));
    logger.debug('REQUEST_USER_WORKSTACK', { user_cases: workstackData.length });
    return {
        label: 'My Cases',
        items: workstackData,
        columns: returnMyCasesWorkstackColumns(configuration, workstackData),
        allocateToWorkstackEndpoint: '/unallocate/'
    };
};

const teamAdapter = async (data, { fromStaticList, logger, teamId, configuration }) => {
    const workstackData = await Promise.all(data.stages
        .filter(stage => stage.teamUUID === teamId)
        .sort(defaultCaseSort)
        .map(bindDisplayElements(fromStaticList)));
    const workflowCards = workstackData
        .reduce((cards, stage) => {
            const index = cards.findIndex(({ value }) => value === stage.caseType);
            if (index >= 0) {
                const card = cards[index];
                card.incrementCount();
                if (isOverdue(configuration, stage.deadline)) {
                    card.incrementOverdue();
                }
                if (isUnallocated(stage.userUUID)) {
                    card.incrementUnallocated();
                }
            } else {
                cards.push(new Card({
                    label: stage.caseTypeDisplayFull,
                    value: stage.caseType,
                    type: 'workflow',
                    count: 1,
                    overdue: isOverdue(configuration, stage.deadline) ? 1 : 0,
                    unallocated: isUnallocated(stage.userUUID) ? 1 : 0
                }));
            }
            return cards;
        }, [])
        .sort(byLabel);
    const teamDisplayName = await fromStaticList('S_TEAMS', teamId);

    logger.debug('REQUEST_TEAM_WORKSTACK', { team: teamDisplayName, workflows: workflowCards.length, rows: workstackData.length });
    return {
        label: teamDisplayName,
        items: workstackData,
        columns: returnWorkstackColumns(configuration, workstackData),
        dashboard: workflowCards,
        teamMembers: [],
        allocateToUserEndpoint: '/allocate/user',
        allocateToTeamEndpoint: '/allocate/team',
        allocateToWorkstackEndpoint: '/unallocate/'
    };
};

const workflowAdapter = async (data, { fromStaticList, logger, teamId, workflowId, configuration }) => {
    const workstackData = await Promise.all(data.stages
        .filter(stage => stage.teamUUID === teamId && stage.caseType === workflowId)
        .sort(defaultCaseSort)
        .map(bindDisplayElements(fromStaticList)));
    const stageCards = workstackData
        .reduce((cards, stage) => {
            const index = cards.findIndex(({ value }) => value === stage.stageType);
            if (index >= 0) {
                const card = cards[index];
                card.incrementCount();
                if (isOverdue(configuration, stage.deadline)) {
                    card.incrementOverdue();
                }
                if (isUnallocated(stage.userUUID)) {
                    card.incrementUnallocated();
                }
            } else {
                cards.push(new Card({
                    label: stage.stageTypeDisplay,
                    value: stage.stageType,
                    type: 'stage',
                    count: 1,
                    overdue: isOverdue(configuration, stage.deadline) ? 1 : 0,
                    unallocated: isUnallocated(stage.userUUID) ? 1 : 0
                }));
            }
            return cards;
        }, [])
        .sort(byLabel);
    const workflowDisplayName = await fromStaticList('S_CASETYPES', workflowId);
    logger.debug('REQUEST_WORKFLOW_WORKSTACK', { workflow: workflowDisplayName, stages: stageCards.length, rows: workstackData.length });
    return {
        label: workflowDisplayName,
        items: workstackData,
        columns: returnWorkstackColumns(configuration, workstackData),
        dashboard: stageCards,
        teamMembers: [],
        allocateToUserEndpoint: '/allocate/user',
        allocateToTeamEndpoint: '/allocate/team',
        allocateToWorkstackEndpoint: '/unallocate/'
    };
};
const stageAdapter = async (data, { fromStaticList, logger, teamId, workflowId, stageId, configuration }) => {
    const workstackData = await Promise.all(data.stages
        .filter(stage => stage.teamUUID === teamId && stage.caseType === workflowId && stage.stageType === stageId)
        .sort(defaultCaseSort)
        .map(bindDisplayElements(fromStaticList)));
    const stageDisplayName = await fromStaticList('S_STAGETYPES', stageId);
    logger.debug('REQUEST_STAGE_WORKSTACK', { stage: stageDisplayName, rows: workstackData.length });
    return {
        label: await fromStaticList('S_STAGETYPES', stageId),
        items: workstackData,
        columns: returnWorkstackColumns(configuration, workstackData),
        teamMembers: [],
        allocateToUserEndpoint: '/allocate/user',
        allocateToTeamEndpoint: '/allocate/team',
        allocateToWorkstackEndpoint: '/unallocate/'
    };
};

module.exports = {
    dashboardAdapter,
    userAdapter,
    teamAdapter,
    workflowAdapter,
    stageAdapter,
    bindDisplayElements
};