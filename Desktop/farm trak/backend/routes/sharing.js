/**
 * Information Sharing Routes for FarmTrak 360
 * Handles community features and information sharing
 */

const express = require('express');
const router = express.Router();

/**
 * Get shared posts
 * GET /api/sharing/posts
 */
router.get('/posts', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { category, limit = 20, offset = 0 } = req.query;

        let query = supabase
            .from('shared_info')
            .select(`
                *,
                author:user_profiles(full_name, avatar_url),
                comments:info_comments(count),
                likes:post_likes(count)
            `)
            .eq('is_public', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq('category', category);
        }

        const { data: posts, error } = await query;

        if (error) {
            throw new Error('Failed to fetch posts');
        }

        res.status(200).json({
            posts: posts || [],
            count: posts?.length || 0,
            filters: { category },
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            error: 'Failed to fetch posts',
            message: error.message
        });
    }
});

/**
 * Create new post
 * POST /api/sharing/posts
 */
router.post('/posts', async (req, res) => {
    try {
        const { title, content, category, tags, is_public = true } = req.body;

        if (!title || !content || !category) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'title, content, and category are required'
            });
        }

        const supabase = req.app.get('supabase');

        const { data: post, error } = await supabase
            .from('shared_info')
            .insert({
                author_id: req.user.id,
                title,
                content,
                category,
                tags: tags || [],
                is_public
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to create post');
        }

        res.status(201).json({
            message: 'Post created successfully',
            post
        });

    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            error: 'Failed to create post',
            message: error.message
        });
    }
});

/**
 * Add comment to post
 * POST /api/sharing/posts/:id/comments
 */
router.post('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'content is required'
            });
        }

        const supabase = req.app.get('supabase');

        const { data: comment, error } = await supabase
            .from('info_comments')
            .insert({
                post_id: id,
                author_id: req.user.id,
                content
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to add comment');
        }

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({
            error: 'Failed to add comment',
            message: error.message
        });
    }
});

module.exports = router;
