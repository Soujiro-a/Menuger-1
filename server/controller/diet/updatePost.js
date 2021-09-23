const { Diet } = require('../../models/diet');
const { verifyAccessToken } = require('../utils/jwt');
const {
  isValidObjectId,
  Types: { ObjectId },
} = require('mongoose');

module.exports = {
  patch: async (req, res) => {
    try {
      const { payload } = verifyAccessToken(req.cookies.accessToken);
      if (!payload) {
        return res.status(400).send({ message: '유효하지 않은 접근입니다.' });
      }

      const { id } = req.params;
      if (!isValidObjectId(id)) {
        return res.status(400).send({ message: '해당 게시물id는 유효하지 않습니다.' });
      }

      const diet = await Diet.findOne({ _id: id });

      if (!diet.user._id.equals(ObjectId(payload))) {
        return res.status(400).send({ message: '게시물의 작성자만 수정할 수 있습니다' });
      }

      const {
        title = diet.title,
        subtitle = diet.subtitle,
        content = diet.content,
        hashtag = diet.hashtag,
      } = req.body;

      diet.title = title;
      diet.subtitle = subtitle;
      diet.content = content;
      diet.hashtag = hashtag;

      await diet.save();
      return res.status(200).send({ message: 'modify diet post success' });
    } catch (err) {
      return res.status(500).send({ message: err.message });
    }
  },
};
