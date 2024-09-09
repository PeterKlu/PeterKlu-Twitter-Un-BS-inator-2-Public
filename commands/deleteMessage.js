async function deleteMessage(reaction, user, applicationId) {
    var authorId = (await reaction.message.author
                        .fetch()
                        .catch((error) => {
                            console.log(error.message);
                            return false;
                        }))?.id;
    var repliedUserId = (await reaction.message
                        .fetch()
                        .catch((error) => {
                            console.log(error.message);
                            return false;
                        }))?.mentions?.repliedUser?.id
    var isDeleteable = authorId === applicationId && repliedUserId === user.id; 
    if (isDeleteable) {
        reaction.message
            .delete()
            .catch((error) => console.log(error.message));
    }     
}

module.exports = deleteMessage;