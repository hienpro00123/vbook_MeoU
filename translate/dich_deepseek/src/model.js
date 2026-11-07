function execute() {
    return Response.success([
        {
            id: "deepseek-flash",
            name: "DeepSeek Flash",
            description: "Model hiện hành, tốc độ nhanh; hỗ trợ tùy chỉnh mức suy nghĩ",
            isNetworkRequired: true
        },
        {
            id: "deepseek-v4-pro",
            name: "DeepSeek V4 Pro",
            description: "Model hiện hành, năng lực cao; hỗ trợ tùy chỉnh mức suy nghĩ",
            isNetworkRequired: true
        }
    ]);
}
