export function parseSignupData(value) {
    const firstName = typeof value?.firstName === 'string' ? value.firstName.trim() : '';
    const lastName = typeof value?.lastName === 'string' ? value.lastName.trim() : '';
    const companyName = typeof value?.companyName === 'string' ? value.companyName.trim() : '';
    if (!firstName || !lastName || !companyName || firstName.length > 60 || lastName.length > 60 || companyName.length > 120) {
        return null;
    }
    return { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`, company_name: companyName };
}
