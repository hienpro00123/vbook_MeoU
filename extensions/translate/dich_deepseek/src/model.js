function execute() {
    return Response.success([
        {
            id: "deepseek-chat",
            name: "DeepSeek Chat",
            description: "DeepSeek-V3, nhanh và thông minh, tối ưu chi phí",
            isNetworkRequired: true
        },
        {
            id: "deepseek-reasoner",
            name: "DeepSeek Reasoner",
            description: "DeepSeek-R1, chuyên suy luận logic phức tạp",
            isNetworkRequired: true
        }
    ]);
}
