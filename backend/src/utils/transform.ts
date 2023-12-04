export const transformAccount = ({ account, pubkey }: any) => {
    const transformedAccount = {
        account: {
            ...account,
            data: account.data.data,
            owner: account.owner["_bn"],
        },
        pubkey: pubkey["_bn"]
    }
    return transformedAccount;
}